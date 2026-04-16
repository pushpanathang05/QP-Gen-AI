import express from 'express'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import mongoose from 'mongoose'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import Syllabus from '../models/Syllabus.js'
import Note from '../models/Note.js'
import Course from '../models/Course.js'
import Institution from '../models/Institution.js'
import Template from '../models/Template.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireRole(['admin', 'faculty']))

const LOCAL_AI_URL = (process.env.ANNA_AI_SERVICE_URL || 'http://127.0.0.1:5001').replace('localhost', '127.0.0.1')
const QP_PDF_SERVICE_URL = (process.env.QP_PDF_SERVICE_URL || 'http://127.0.0.1:5000').replace('localhost', '127.0.0.1')

console.log('>>> GENERATION ROUTES LOADED (v2 with extractContext fix) <<<');
/**
 * @route   POST /api/generation/convert-to-pdf
 * @desc    Convert generated question JSON to PDF using the QP-PDF service
 */
router.post('/convert-to-pdf', async (req, res, next) => {
  try {
    const { courseId, institutionId, templateId, sections, examName, semester, regulation, time, maxMarks } = req.body || {}

    console.log(`[Convert-to-PDF]: Request received for courseId: ${courseId}`);

    if (!courseId) return res.status(400).json({ error: 'courseId is required' })
    if (!sections || !Array.isArray(sections)) return res.status(400).json({ error: 'sections must be an array' })

    // 1. Fetch metadata for the PDF header
    let course;
    try {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        course = await Course.findById(courseId)
      }
      if (!course) {
        course = await Course.findOne({ courseId: String(courseId).toUpperCase() })
      }
    } catch (err) {
      console.error(`[Convert-to-PDF]: Error finding course: ${err.message}`);
    }

    if (!course) {
      console.error(`[Convert-to-PDF]: Course not found: ${courseId}`);
      return res.status(404).json({ error: 'Course not found' })
    }

    const institution = await Institution.findById(institutionId || course.institutionId)
    
    // 2. Prepare the payload for QP-PDF
    // Note: QP-PDF expects a folder name in src/templates (e.g., 'anna-university').
    // If templateId is a MongoDB ID, we default to 'anna-university' for now.
    const finalTemplateId = (templateId && !mongoose.Types.ObjectId.isValid(templateId)) 
      ? templateId 
      : 'anna-university';

    const payload = {
      templateId: finalTemplateId,
      collegeName: institution?.name || req.body.collegeName || 'Example Engineering College',
      departmentName: course.department || req.body.departmentName || 'Department of Computer Science',
      examName: examName || 'B.E/B.Tech. DEGREE EXAMINATIONS',
      semester: semester || `${course.semester || 'Third'} Semester`,
      subjectCode: course.code,
      subjectName: course.title,
      regulation: regulation || 'Regulations 2021',
      time: time || '3 Hours',
      maxMarks: maxMarks || 100,
      sections: sections.map(s => ({
        id: s.sectionId || s.id,
        title: s.title,
        marksPerQuestion: s.marksPerQuestion || (s.questions && s.questions?.[0]?.marks) || 2,
        totalQuestionsToAnswer: s.totalQuestionsToAnswer || s.questions?.length || 10,
        questions: (s.questions || []).map(q => ({
          text: q.text || q.questionText || '...',
          marks: q.marks || 2
        }))
      }))
    }

    // 3. Forward to QP-PDF service
    console.log(`[Convert-to-PDF]: Sending payload to ${QP_PDF_SERVICE_URL}/api/v1/pdf/generate`);
    
    try {
      const pdfResponse = await axios.post(`${QP_PDF_SERVICE_URL}/api/v1/pdf/generate`, payload, {
        responseType: 'stream',
        timeout: 120000,
        family: 4
      })

      // 4. Stream response back to client
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="question-paper.pdf"')
      pdfResponse.data.pipe(res)
    } catch (err) {
      console.error('[Convert-to-PDF Axios Error]:', err.message);
      
      if (err.response && err.response.data) {
        // Since responseType is 'stream', we need to read the error from the stream
        let errorData = '';
        try {
          for await (const chunk of err.response.data) {
            errorData += chunk;
          }
        } catch (readErr) {
          errorData = 'Could not read error stream';
        }
        
        console.error('[Convert-to-PDF Downstream Error]:', errorData);
        
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch (e) {
          parsedError = { error: errorData };
        }
        
        return res.status(err.response.status).json({ 
          error: parsedError.error || parsedError.message || 'PDF Generation failed in QP-PDF service.',
          details: parsedError
        });
      }
      
      throw err;
    }

  } catch (err) {
    console.error('[Convert-to-PDF Catch-All Error]:', err.message);
    next(err);
  }
})

// --- HELPER FUNCTIONS (Restored at top-level) ---

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

async function generateWithLocalAI({ topic, btlLevel, marks, context }) {
  try {
    const response = await axios.post(`${LOCAL_AI_URL}/generate-single-question`, {
      topic,
      btlLevel,
      marks,
      family: 4, // FORCE IPv4
      timeout: 30000
    })
    return response.data?.questionText || null
  } catch (err) {
    console.error('Local AI generation error:', err.message)
    return null
  }
}

function buildFallbackQuestion({ topic, btlLevel, marks }) {
  const verbs = {
    K1: 'Define',
    K2: 'Explain',
    K3: 'Apply',
    K4: 'Analyze',
    K5: 'Design',
    K6: 'Evaluate'
  }
  const verb = verbs[btlLevel] || 'Explain'
  const base = topic ? `${verb} ${topic}` : `${verb} the concept.`
  return marks >= 10 ? `${base}. Support your answer with suitable example(s).` : `${base}.`
}

// --- ROUTES ---

/**
 * @route   POST /api/generation/generate-au-paper
 */
router.post('/generate-au-paper', async (req, res, next) => {
  try {
    const { courseId, code, subject, semester } = req.body || {}
    console.log(`[Full Paper API]: Received request for courseId: ${courseId}`);

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' })
    }

    // Safe ObjectId conversion
    let oid;
    try {
      oid = new mongoose.Types.ObjectId(courseId);
    } catch (err) {
      console.error(`[Full Paper API]: Invalid courseId format: ${courseId}`);
      return res.status(400).json({ error: 'Invalid courseId format' });
    }

    const syllabus = await Syllabus.findOne({ 
      courseId: { $in: [oid, String(courseId)] } 
    }).sort({ createdAt: -1 })
    
    if (!syllabus || !syllabus.pdf?.storage?.path) {
      console.warn(`[Full Paper API]: Syllabus not found for course: ${courseId}`);
      return res.status(404).json({ error: 'No syllabus found for this course. Please upload one first.' })
    }

    const syllabusPath = syllabus.pdf.storage.path
    if (!fs.existsSync(syllabusPath)) {
       console.error(`[Full Paper API]: File missing on disk at ${syllabusPath}`);
       return res.status(500).json({ error: 'Syllabus PDF file missing on server.' });
    }

    const form = new FormData()
    form.append('syllabus', fs.createReadStream(syllabusPath))
    form.append('code', code || 'CODE101')
    form.append('subject', subject || 'Name')
    form.append('semester', semester || 'V Sem')

    const pythonResponse = await axios.post(`${LOCAL_AI_URL}/generate-paper`, form, {
      headers: { ...form.getHeaders() },
      responseType: 'stream',
      timeout: 120000,
      family: 4 // FORCE IPv4
    })

    console.log(`[Full Paper API]: Python service responded with ${pythonResponse.status}`);
    res.setHeader('Content-Type', 'application/pdf')
    pythonResponse.data.pipe(res)

  } catch (err) {
    console.error('[Full Paper API Error]:', err.message);
    if (err.response) {
       return res.status(err.response.status).json({ error: 'AI Service failed. Check Python logs.' });
    }
    next(err);
  }
})

/**
 * @route   POST /api/generation/mock
 */
router.post('/mock', async (req, res, next) => {
  try {
    const { courseId, sections } = req.body || {}
    console.log(`[Mock Generator API]: Building paper for Course: ${courseId}`);

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

            // Try local AI first
            questionText = await generateWithLocalAI({
              topic,
              btlLevel: q.btlLevel,
              marks: q.marks,
              context: ctx,
            })

            // Fallback if AI fails
            if (!questionText) {
              questionText = buildFallbackQuestion({
                topic,
                btlLevel: q.btlLevel,
                marks: q.marks,
              })
            }

            return { ...q, questionText }
          })
        )
        return { ...s, questions: nextQs }
      })
    )

    res.json({ sections: out })
  } catch (err) {
    console.error('[Mock API Error]:', err.message);
    next(err)
  }
})

/**
 * @route   POST /api/generation/render-paper
 * @desc    Forward paper data to Python Engine for PDF rendering
 */
router.post('/render-paper', async (req, res, next) => {
  try {
    console.log(`[Render-Paper API]: Forwarding to ${LOCAL_AI_URL}/render-paper`);
    
    const pythonResponse = await axios.post(`${LOCAL_AI_URL}/render-paper`, req.body, {
      responseType: 'stream',
      timeout: 120000,
      family: 4 // FORCE IPv4
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="question-paper.pdf"')
    pythonResponse.data.pipe(res)

  } catch (err) {
    console.error('[Render-Paper API Error]:', err.message);
    if (err.response) {
       return res.status(err.response.status).json({ error: 'Python Engine failed to render PDF.' });
    }
    next(err);
  }
})

router.use((err, req, res, next) => {
  const message = err?.message || 'Unknown error'
  res.status(500).json({ error: message })
})

export default router
