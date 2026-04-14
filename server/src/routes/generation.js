import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import Syllabus from '../models/Syllabus.js'
import Note from '../models/Note.js'
import axios from 'axios'
import Groq from 'groq-sdk'

const router = express.Router()

router.use(requireAuth)
router.use(requireRole(['admin', 'faculty']))

const groqApiKey = process.env.GROQ_API_KEY

/**
 * Gets the Bloom's Taxonomy Category name for a given BTL level.
 */
function getBtlCategory(btl) {
  const lvl = String(btl || '').toUpperCase()
  switch (lvl) {
    case 'K1': return 'Remembering'
    case 'K2': return 'Understanding'
    case 'K3': return 'Applying'
    case 'K4': return 'Analyzing'
    case 'K5': return 'Evaluating'
    case 'K6': return 'Creating'
    default: return 'Understanding'
  }
}

/**
 * Maps BTL levels to specific question formats as requested.
 */
function mapBtlToType(btl) {
  const lvl = String(btl || '').toUpperCase()
  switch (lvl) {
    case 'K1':
      // Remembering: MCQ with options, fill in the blanks, or true/false (1 mark)
      return 'k1_short'
    case 'K2':
      // Understanding: Definitions and basic explanations
      return 'definition'
    case 'K3':
      // Applying: Comparison and differentiation type questions
      return 'comparison'
    case 'K4':
      // Analyzing: Analytical / research-oriented questions with examples
      return 'analytical_example'
    case 'K5':
      // Evaluating: Creating, solving, or proving type questions
      return 'problem_solving'
    case 'K6':
      // Creating: Design and implementation type questions
      return 'design_implementation'
    default:
      return 'one_mark'
  }
}

/**
 * Replaces placeholders with topic words if AI is not available.
 */
function buildQuestionText({ topic, btlLevel, marks, context, type }) {
  const t = String(topic || '').trim()
  const btlCategory = getBtlCategory(btlLevel)
  const m = Number(marks || 0)

  // Use mapBtlToType if type is not specifically provided
  const qType = (type || mapBtlToType(btlLevel)).toLowerCase()

  const verbs = {
    K1: 'Identify',
    K2: 'Explain',
    K3: 'Illustrate',
    K4: 'Analyze',
    K5: 'Evaluate',
    K6: 'Formulate',
  }
  const verb = verbs[String(btlLevel).toUpperCase()] || 'Explain'

  if (qType === 'k1_short') {
    return t
      ? `Which of the following is most closely related to ${t}?\n    A) [Option A]\n    B) [Option B]\n    C) [Option C]\n    D) [Option D]`
      : `Which of the following best describes the core concept of this unit?\n    A) [Option A]\n    B) [Option B]\n    C) [Option C]\n    D) [Option D]`
  }

  if (qType === 'definition') {
    return t ? `Define ${t}.` : `Define the given term.`
  }

  if (qType === 'comparison') {
    return t ? `Compare and differentiate ${t} with related concepts.` : `Compare and differentiate the given concepts.`
  }

  if (qType === 'analytical_example') {
    return t ? `Analyze ${t} in detail. Provide suitable example(s) to support your analysis.` : `Provide an analytical research on the given topic with examples.`
  }

  if (qType === 'problem_solving') {
    return t ? `Solve/Prove the following regarding ${t}.` : `Create, solve, or prove the given problem/statement.`
  }

  if (qType === 'design_implementation') {
    return t ? `Design and implement a solution for ${t}.` : `Provide a complete design and implementation for the given requirements.`
  }

  // Fallback for generic types
  if (qType === 'one_mark') {
    return t ? `${verb} ${t} in one or two sentences.` : `${verb} the concept briefly.`
  }

  const base = t ? `${verb} ${t}` : `${verb} the concept.`

  if (m >= 10) {
    const scenarioIntro = 'Consider the following scenario related to the topic.'
    if (context) {
      return `${scenarioIntro} ${base}. Support your answer with suitable example(s). (Context: ${context})`
    }
    return `${scenarioIntro} ${base}. Support your answer with suitable example(s).`
  }

  if (m >= 5) {
    if (context) return `${base}. (Context: ${context})`
    return `${base}.`
  }

  return `${base}.`
}

function extractContext(text, topic) {
  const src = String(text || '').replace(/\s+/g, ' ').trim()
  if (!src) return ''

  const t = String(topic || '').trim()
  if (!t) return src.slice(0, 180)

  const idx = src.toLowerCase().indexOf(t.toLowerCase())
  if (idx === -1) return src.slice(0, 180)

  const start = Math.max(0, idx - 60)
  const end = Math.min(src.length, idx + 120)
  return src.slice(start, end)
}




async function generateWithGroq({ topic, unit, btlLevel, marks, context, type }) {
  if (!groqApiKey) {
    console.error('Groq API Key is missing or invalid.')
    return null
  }

  const btlCategory = getBtlCategory(btlLevel)
  const qType = (type || mapBtlToType(btlLevel)).toLowerCase()
  const isK1 = String(btlLevel).toUpperCase() === 'K1'

  let typeInstruction = ''
  if (isK1) {
    typeInstruction = `### STRICT MCQ FORMAT REQUIREMENTS:
- TASK: Generate a 1-mark Multiple Choice Question.
- FORMAT: [Question Stem] followed by 4 options labeled A), B), C), D).
- OPTIONS: Provide 1 correct answer and 3 diverse, plausible, and challenging distractors. 
- QUALITY: Ensure the distractors are meaningful and relate to the topic.
- DO NOT provide the answer key.
- DO NOT provide any explanation.`
  } else {
    switch (qType) {
      case 'definition':
        typeInstruction = '- Question Type: Definition.\n- Ask for a clear and concise definition.\n'
        break
      case 'comparison':
        typeInstruction = '- Question Type: Comparison and Differentiation.\n- The student should compare and distinguish the topic from similar concepts.\n'
        break
      case 'analytical_example':
        typeInstruction = '- Question Type: Analytical Research with Examples.\n- Require the student to analyze the topic and provide specific examples.\n'
        break
      case 'problem_solving':
        typeInstruction = '- Question Type: Creating, Solving, or Proving.\n- Ask the student to solve a problem, prove a statement, or create a specific artifact/process.\n'
        break
      case 'design_implementation':
        typeInstruction = '- Question Type: Design and Implementation.\n- Require a detailed design plan and implementation steps/code.\n'
        break
      default:
        typeInstruction = '- Question Type: Standard Exam Question.\n'
    }
  }

  const prompt = `### QUESTION GENERATION REQUIREMENTS:
- TOPIC: ${topic || 'General Topic'}
- UNIT: ${unit || 'N/A'}
- MARKS: ${marks}
- BLOOM'S TAXONOMY LEVEL (MODEL): ${btlLevel} (${btlCategory})
- REFERENCE CONTEXT: 
---
${context || 'Use general academic knowledge.'}
---

### INSTRUCTIONS:
${typeInstruction}
- Response Format: Output ONLY the verbatim question text.
- Do NOT include any preamble or extra text.
${marks >= 10 ? '- This is a high-mark question. It MUST be scenario-based or require detailed analytical examples.' : ''}

### GENERATED QUESTION:`

  try {
    const groq = new Groq({ apiKey: groqApiKey })
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0.5,
    })
    const text = chatCompletion.choices[0]?.message?.content?.trim()
    console.log(`Successfully generated question for "${topic}" using Groq.`)
    return text || null
  } catch (err) {
    console.error(`Groq generation error for "${topic}":`, err.message)
    return null
  }
}


router.post('/mock', async (req, res, next) => {
  try {
    const { courseId, sections } = req.body || {}

    if (!courseId) return res.status(400).json({ error: 'courseId is required' })
    if (!Array.isArray(sections)) return res.status(400).json({ error: 'sections must be an array' })

    const syllabus = await Syllabus.findOne({ courseId }).sort({ createdAt: -1 })
    const notes = await Note.find({ courseId }).sort({ createdAt: -1 }).limit(5)

    const syllabusText = syllabus?.extraction?.extractedText || ''
    const notesText = (notes || []).map((n) => n?.extraction?.extractedText || '').join(' ')
    const combined = `${syllabusText} ${notesText}`.trim()

    const out = await Promise.all(
      sections.map(async (s) => {
        const qs = Array.isArray(s.questions) ? s.questions : []
        const nextQs = await Promise.all(
          qs.map(async (q) => {
            const topic = q.topic
            const ctx = extractContext(combined, topic)
            let questionText = null

            questionText = await generateWithGroq({
              topic,
              unit: q.unit,
              btlLevel: q.btlLevel,
              marks: q.marks,
              context: ctx,
              type: q.type,
            })

            if (!questionText) {
              questionText = buildQuestionText({
                topic,
                btlLevel: q.btlLevel,
                marks: q.marks,
                context: ctx,
                type: q.type,
              })
            }

            return {
              ...q,
              questionText,
            }
          })
        )

        return {
          ...s,
          questions: nextQs,
        }
      })
    )

    res.json({ sections: out })
  } catch (err) {
    next(err)
  }
})

router.use((err, req, res, next) => {
  const message = err?.message || 'Unknown error'
  res.status(500).json({ error: message })
})

export default router
