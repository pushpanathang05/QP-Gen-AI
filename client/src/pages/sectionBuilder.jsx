import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../services/api'
import BTLBadge from '../components/BTLBadge'

const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5005').replace(/\/$/, '')

function SectionBuilder() {
  const [searchParams] = useSearchParams()
  const courseId = searchParams.get('courseId') || ''
  const examType = searchParams.get('examType') || ''
  const templateId = searchParams.get('templateId') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [course, setCourse] = useState(null)
  const [template, setTemplate] = useState(null)

  const [paperTitle, setPaperTitle] = useState('Question Paper')

  const [sections, setSections] = useState([])
  const [downloading, setDownloading] = useState(false)

  // Meta for PDF
  const [regulation, setRegulation] = useState('Regulations 2021')
  const [examName, setExamName] = useState('B.E/B.Tech. DEGREE EXAMINATIONS')
  const [semester, setSemester] = useState('')
  const [examTime, setExamTime] = useState('3 Hours')
  const [maxMarks, setMaxMarks] = useState(100)

  const examLabel = useMemo(() => {
    if (examType === 'internal') return 'Internal'
    if (examType === 'end_sem') return 'End Semester'
    return '-'
  }, [examType])

  const initSectionsFromTemplate = useCallback((tpl) => {
    const raw = tpl?.format?.sections
    let sectionsArray = []

    if (raw && !Array.isArray(raw) && typeof raw === 'object') {
      sectionsArray = Object.keys(raw).map((key, idx) => {
        const s = raw[key]
        const count = Number(s.number_of_questions || 0)
        const marks = Number(s.marks_per_question || 0)
        const btlDefault = 'K1'
        
        // Continuous numbering across sections
        const previousQuestionsCount = sectionsArray.reduce((acc, sec) => acc + sec.questions.length, 0)
        
        const questions = Array.from({ length: Math.max(1, count || 1) }).map((_, i) => {
          return {
            questionNumber: String(previousQuestionsCount + i + 1),
            type: marks >= 10 ? 'analytical' : marks <= 2 ? 'one_mark' : 'definition',
            unit: '',
            topic: '',
            btlLevel: btlDefault,
            marks: marks || (key === 'part_a' ? 2 : 13),
            questionText: '',
          }
        })
        return {
          sectionId: String(key).toUpperCase().replace('PART_', ''),
          title: String(s.title || `Part ${String.fromCharCode(65 + idx)}`),
          instructions: '',
          questions,
        }
      })
    } else if (Array.isArray(raw) && raw.length > 0) {
      sectionsArray = raw.map((s, idx) => {
        const count = Number(s.questionsCount || 0)
        const marks = Number(s.marksPerQuestion || 0)
        const btlDefault = Array.isArray(s.btlLevels) && s.btlLevels.length > 0 ? String(s.btlLevels[0]) : 'K1'
        const baseNumber = idx * 100
        const questions = Array.from({ length: Math.max(1, count || 1) }).map((_, i) => ({
          questionNumber: String(baseNumber + i + 1),
          type: marks >= 10 ? 'analytical' : marks <= 2 ? 'one_mark' : 'definition',
          unit: '',
          topic: '',
          btlLevel: btlDefault,
          marks: marks || 0,
          questionText: '',
        }))
        return {
          sectionId: String(s.sectionId || String.fromCharCode(65 + idx)),
          title: String(s.title || `Part ${String.fromCharCode(65 + idx)}`),
          instructions: String(s.description || ''),
          questions,
        }
      })
    }

    if (sectionsArray.length === 0) {
      sectionsArray = [
        {
          sectionId: 'A',
          title: 'Part A',
          instructions: 'Answer all questions.',
          questions: [
            { questionNumber: '1', type: 'one_mark', unit: '1', topic: '', btlLevel: 'K1', marks: 2, questionText: '' },
            { questionNumber: '2', type: 'one_mark', unit: '1', topic: '', btlLevel: 'K1', marks: 2, questionText: '' },
          ],
        },
      ]
    }

    return sectionsArray
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setError('')
      setLoading(true)
      try {
        if (!courseId || !templateId || !examType) {
          setCourse(null)
          setTemplate(null)
          return
        }

        const [courseRes, templateRes] = await Promise.all([
          apiRequest(`/api/courses/${encodeURIComponent(courseId)}`),
          apiRequest(`/api/templates/${encodeURIComponent(templateId)}`),
        ])

        if (cancelled) return
        setCourse(courseRes?.item || null)
        setTemplate(templateRes?.item || null)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load section builder context.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [courseId, examType, templateId])

  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    if (!template) return
    setSections((prev) => {
      if (Array.isArray(prev) && prev.length > 0) return prev
      return initSectionsFromTemplate(template)
    })
  }, [template, initSectionsFromTemplate])

  const updateQuestion = (sectionIndex, questionIndex, patch) => {
    setSections((prev) =>
      (prev || []).map((s, si) => {
        if (si !== sectionIndex) return s
        const nextQuestions = (s.questions || []).map((q, qi) => {
          if (qi !== questionIndex) return q;
          const nextQ = { ...q, ...patch };
          // Removed hardcoded K1 marks override
          return nextQ;
        })
        return { ...s, questions: nextQuestions }
      })
    )
  }

  const addQuestion = (sectionIndex) => {
    setSections((prev) =>
      (prev || []).map((s, si) => {
        if (si !== sectionIndex) return s
        const next = [...(s.questions || [])]
        const last = next[next.length - 1]
        const nextNo = last?.questionNumber ? String(Number(last.questionNumber) + 1) : String(next.length + 1)

        const nextBtl = last?.btlLevel || 'K1'
        let nextMarks = Number(last?.marks || (s.sectionId === 'A' ? 2 : 13))
        let nextType = marks >= 10 ? 'analytical' : marks <= 2 ? 'one_mark' : 'definition'

        next.push({ questionNumber: nextNo, type: nextType, topic: '', btlLevel: nextBtl, marks: nextMarks, questionText: '' })
        return { ...s, questions: next }
      })
    )
  }

  const removeQuestion = (sectionIndex, questionIndex) => {
    setSections((prev) =>
      (prev || []).map((s, si) => {
        if (si !== sectionIndex) return s
        const next = (s.questions || []).filter((_, qi) => qi !== questionIndex)
        return { ...s, questions: next.length > 0 ? next : s.questions }
      })
    )
  }

  const updateSection = (sectionIndex, patch) => {
    setSections((prev) =>
      (prev || []).map((s, si) => (si === sectionIndex ? { ...s, ...patch } : s)),
    )
  }

  const buildPdfPayload = useCallback(() => {
    return {
      title: paperTitle,
      examType,
      university: "ANNA UNIVERSITY, CHENNAI",
      course: {
        courseId: course?.courseId || courseId,
        code: course?.code,
        title: course?.title,
        department: course?.department,
        semester: course?.semester,
      },
      part_a: (sections || [])
        .find(s => s.sectionId === 'A')?.questions.map(q => ({
          questionNumber: q.questionNumber || "0",
          questionText: q.questionText || "...",
          btlLevel: q.btlLevel || "K1",
          marks: q.marks || 2
        })) || [],
      part_b: ((sections || []).find(s => s.sectionId === 'B')?.questions || []).reduce((acc, q, idx) => {
        // Safe grouping into units (assuming 2 questions per unit: a/b)
        const unitIdx = Math.floor(idx / 2);
        if(!acc[unitIdx]) acc[unitIdx] = { unit: `UNIT ${unitIdx + 1}`, questions: [] };
        
        acc[unitIdx].questions.push({
          choice: idx % 2 === 0 ? 'a' : 'b',
          questionText: q.questionText || "...",
          btlLevel: q.btlLevel || "K1",
          marks: q.marks || 13
        });
        return acc;
      }, [])
    }
  }, [paperTitle, examType, course, courseId, sections])

  const addSection = () => {
    setSections((prev) => {
      const existing = prev || []
      const labels = ['A', 'B', 'C', 'D']
      const used = new Set(existing.map((s) => String(s.sectionId || '').toUpperCase()))
      const nextLabel = labels.find((l) => !used.has(l)) || String.fromCharCode(65 + existing.length)
      const defaultQuestion = {
        questionNumber: '1',
        type: 'analytical',
        topic: '',
        btlLevel: 'K1',
        marks: 2,
        questionText: '',
      }
      return [
        ...existing,
        {
          sectionId: nextLabel,
          title: `Part ${nextLabel}`,
          instructions: '',
          questions: [defaultQuestion],
        },
      ]
    })
  }

  const generatePdf = async () => {
    setError('')
    if (!sections || !sections.length) {
      setError('Please add at least one section with questions.')
      return
    }

    // Prepare payload for qp-pdf via our backend proxy
    const payload = {
      courseId,
      templateId: templateId || 'anna-university',
      examName: examName,
      semester: semester || `${course?.semester || 'Third'} Semester`,
      regulation: regulation,
      time: examTime,
      maxMarks: maxMarks,
      sections: (sections || []).map(s => {
        const marksPerQ = s.questions?.[0]?.marks || (s.sectionId === 'A' ? 2 : 13);
        const totalQs = s.questions?.length || 0;
        
        return {
          id: `PART-${s.sectionId}`, // e.g. PART-A
          title: `${s.title} (${totalQs} x ${marksPerQ} = ${totalQs * marksPerQ} Marks)`,
          marksPerQuestion: marksPerQ,
          totalQuestionsToAnswer: totalQs,
          questions: (s.questions || []).map(q => ({
            text: q.questionText || '...',
            marks: Number(q.marks || 0)
          }))
        };
      })
    }

    try {
      setDownloading(true)
      const res = await fetch(`${API_BASE_URL}/api/generation/convert-to-pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to render paper using QP-PDF Engine.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Question_Paper_${course?.code || 'Generated'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[PDF Generation Error]:', err);
      // Try to extract detailed error message if available
      const detailMsg = err?.message || 'Failed to generate PDF.';
      setError(detailMsg);
    } finally {
      setDownloading(false)
    }
  }

  const generateQuestions = async () => {
    setError('')
    try {
      const payload = {
        courseId,
        sections: (sections || []).map((s) => ({
          sectionId: s.sectionId,
          title: s.title,
          instructions: s.instructions || '',
          questions: (s.questions || []).map((q) => ({
            questionNumber: q.questionNumber,
            type: q.type || 'analytical',
            topic: q.topic,
            btlLevel: q.btlLevel,
            marks: Number(q.marks || 0),
          })),
        })),
      }

      const res = await apiRequest('/api/generation/mock', { method: 'POST', body: payload })
      const nextSections = res?.sections
      if (!Array.isArray(nextSections)) throw new Error('Invalid response from generator')
      setSections(nextSections)
    } catch (err) {
      setError(err?.message || 'Failed to generate questions.')
    }
  }

  const generateAuPaper = async () => {
    setError('')
    setDownloading(true)
    try {
      const payload = {
        courseId,
        code: course?.code,
        subject: course?.title,
        semester: course?.semester || 'V Semester'
      }

      const res = await fetch(`${API_BASE_URL}/api/generation/generate-au-paper`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Failed to generate Anna University paper. Ensure AI service is running.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AU_Paper_${course?.code || 'Generated'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.message || 'Failed to generate AU paper.')
    } finally {
      setDownloading(false)
    }
  }

  const analyzeBtl = async () => {
    setError('')
    try {
      const allQuestions = sections.flatMap(s => s.questions.map(q => ({ questionText: q.questionText, btlLevel: q.btlLevel })))
      const res = await apiRequest('/api/generation/ai-btl-analyze', { method: 'POST', body: { questions: allQuestions }})
      setAnalysis(res)
    } catch (err) {
      setError(err?.message || 'BTL Analysis failed.')
    }
  }

  const autoFixBtl = async () => {
    setError('')
    try {
      const payload = { questions: sections.flatMap(s => s.questions) }
      const res = await apiRequest('/api/generation/auto-btl', { method: 'POST', body: payload })
      
      // Map back to sections
      const updated = [...sections]
      let cursor = 0
      updated.forEach(s => {
        s.questions = res.questions.slice(cursor, cursor + s.questions.length)
        cursor += s.questions.length
      })
      setSections(updated)
      analyzeBtl()
    } catch (err) {
      setError(err?.message || 'Auto-BTL failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-700 dark:from-indigo-700 dark:to-violet-800">
          <h1 className="text-2xl font-bold text-white">Section Builder</h1>
          <p className="text-indigo-100 dark:text-indigo-200 mt-1 transition-colors">Configure sections and Bloom levels (BTL) for generation.</p>
        </div>
        {error && <div className="px-6 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30">{error}</div>}
      </div>

      {!courseId || !templateId || !examType ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Missing selection. Please go to <span className="font-medium text-gray-900 dark:text-white">Exam Mode</span> and pick a course, exam type, and template.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Paper Context</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Course</p>
                  <p className="font-medium text-gray-900 dark:text-white transition-colors">{course ? `${course.code} — ${course.title}` : courseId}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Exam Type</p>
                  <p className="font-medium text-gray-900 dark:text-white transition-colors">{examLabel}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                   <p className="text-xs text-gray-500 dark:text-gray-400">Regulation</p>
                   <input 
                    value={regulation} 
                    onChange={e => setRegulation(e.target.value)}
                    className="mt-0.5 w-full bg-transparent border-none p-0 font-medium text-gray-900 dark:text-white focus:ring-0" 
                   />
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                   <p className="text-xs text-gray-500 dark:text-gray-400">Semester</p>
                   <input 
                    value={semester} 
                    onChange={e => setSemester(e.target.value)}
                    placeholder={course?.semester || 'Third Semester'}
                    className="mt-0.5 w-full bg-transparent border-none p-0 font-medium text-gray-900 dark:text-white focus:ring-0" 
                   />
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                   <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
                   <input 
                    value={examTime} 
                    onChange={e => setExamTime(e.target.value)}
                    className="mt-0.5 w-full bg-transparent border-none p-0 font-medium text-gray-900 dark:text-white focus:ring-0" 
                   />
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                   <p className="text-xs text-gray-500 dark:text-gray-400">Max Marks</p>
                   <input 
                    type="number"
                    value={maxMarks} 
                    onChange={e => setMaxMarks(Number(e.target.value))}
                    className="mt-0.5 w-full bg-transparent border-none p-0 font-medium text-gray-900 dark:text-white focus:ring-0" 
                   />
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 md:col-span-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Full Exam Name</p>
                  <input 
                    value={examName} 
                    onChange={e => setExamName(e.target.value)}
                    className="mt-0.5 w-full bg-transparent border-none p-0 font-medium text-gray-900 dark:text-white focus:ring-0" 
                   />
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-4 py-2 text-sm font-semibold rounded-md text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Add Section (Part A/B/C/D)
                  </button>
                  <button
                    type="button"
                    onClick={generateQuestions}
                    className="px-4 py-2 text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Generate Questions
                  </button>
                  <button
                    type="button"
                    onClick={autoFixBtl}
                    className="px-4 py-2 text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Auto-Assign BTL (AI)
                  </button>
                  <button
                    type="button"
                    onClick={analyzeBtl}
                    className="px-4 py-2 text-sm font-semibold rounded-md text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                  >
                    Analyze Balance
                  </button>
                  <button
                    type="button"
                    onClick={generatePdf}
                    disabled={downloading}
                    className={`px-4 py-2 text-sm font-semibold rounded-md text-white transition-colors ${downloading ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                  >
                    {downloading ? 'Generating...' : 'Generate Official PDF'}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Paper Title</label>
                <input
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                />
              </div>

              <div className="mt-6 space-y-6">
                {sections.map((s, si) => (
                  <div key={`${s.sectionId}-${si}`} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white transition-colors">{s.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Section ID: {s.sectionId}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addQuestion(si)}
                        className="px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Add Question
                      </button>
                    </div>

                    <div className="p-4 space-y-4 overflow-x-auto">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Section Instructions</label>
                        <textarea
                          value={s.instructions || ''}
                          onChange={(e) => updateSection(si, { instructions: e.target.value })}
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs transition-colors"
                          rows={2}
                          placeholder="e.g., Answer ALL questions. Each question carries equal marks."
                        />
                      </div>
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                            <th className="py-2 pr-3 w-16">Q.No</th>
                            <th className="py-2 pr-3 w-16">Unit</th>
                            <th className="py-2 pr-3">Topic (Constraint)</th>
                            <th className="py-2 pr-3 w-20">BTL</th>
                            <th className="py-2 pr-3 w-16">Marks</th>
                            <th className="py-2 pr-3">Question Text</th>
                            <th className="py-2 w-10">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {(s.questions || []).map((q, qi) => (
                            <tr key={`${q.questionNumber}-${qi}`} className="align-top">
                              <td className="py-2 pr-3">
                                <input
                                  value={q.questionNumber}
                                  onChange={(e) => updateQuestion(si, qi, { questionNumber: e.target.value })}
                                  className="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm transition-colors"
                                />
                              </td>
                              <td className="py-2 pr-3">
                                <input
                                  value={q.unit || ''}
                                  onChange={(e) => updateQuestion(si, qi, { unit: e.target.value })}
                                  className="w-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm transition-colors"
                                  placeholder="U1"
                                />
                              </td>
                              <td className="py-2 pr-3">
                                <input
                                  value={q.topic}
                                  onChange={(e) => updateQuestion(si, qi, { topic: e.target.value })}
                                  className="w-[22rem] max-w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm transition-colors"
                                  placeholder="e.g., Hashing, AVL Tree..."
                                />
                              </td>
                              <td className="py-2 pr-3">
                                <select
                                  value={q.btlLevel}
                                  onChange={(e) => updateQuestion(si, qi, { btlLevel: e.target.value })}
                                  className="w-24 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm transition-colors"
                                >
                                  {['K1', 'K2', 'K3', 'K4', 'K5', 'K6'].map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                      {lvl}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 pr-3">
                                <input
                                  type="number"
                                  value={q.marks}
                                  onChange={(e) => updateQuestion(si, qi, { marks: e.target.value })}
                                  className="w-24 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm transition-colors"
                                />
                              </td>
                              <td className="py-2 pr-3">
                                <textarea
                                  value={q.questionText || ''}
                                  onChange={(e) => updateQuestion(si, qi, { questionText: e.target.value })}
                                  className="w-[26rem] max-w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm transition-colors"
                                  rows={2}
                                />
                              </td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(si, qi)}
                                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">BTL Intelligence</h2>
              {analysis ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Balance Score</span>
                    <span className={`text-lg font-bold ${analysis.balance_score > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
                      {analysis.balance_score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${analysis.balance_score}%` }}
                    ></div>
                  </div>
                  {analysis.recommendations.length > 0 && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Suggestions:</p>
                      <ul className="mt-1 space-y-1">
                        {analysis.recommendations.map((rec, i) => (
                          <li key={i} className="text-[10px] text-indigo-600 dark:text-indigo-300">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Click 'Analyze Balance' to check Bloom's Taxonomy distribution.
                </p>
              )}
              <div className="mt-4">
                <BTLBadge />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default SectionBuilder