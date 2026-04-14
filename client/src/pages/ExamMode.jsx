import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'

function ExamMode() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [courses, setCourses] = useState([])
  const [templates, setTemplates] = useState([])

  const [courseId, setCourseId] = useState('')
  const [examType, setExamType] = useState('internal')
  const [templateId, setTemplateId] = useState('')

  const selectedCourse = useMemo(
    () => (courses || []).find((c) => c._id === courseId) || null,
    [courses, courseId],
  )

  const filteredTemplates = useMemo(() => {
    const byType = (templates || []).filter((t) => t.type === examType)
    return byType
  }, [templates, examType])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setError('')
      setLoading(true)
      try {
        const coursesRes = await apiRequest('/api/courses')
        const templatesRes = await apiRequest('/api/templates?status=approved')

        if (cancelled) return
        setCourses(coursesRes?.items || [])
        setTemplates(templatesRes?.items || [])
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load courses/templates.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!templateId) return
    const exists = filteredTemplates.some((t) => t._id === templateId)
    if (!exists) setTemplateId('')
  }, [filteredTemplates, templateId])

  const handleContinue = () => {
    setError('')
    if (!courseId) {
      setError('Please select a course.')
      return
    }
    if (!templateId) {
      setError('Please select a template.')
      return
    }

    const q = new URLSearchParams({
      courseId,
      examType,
      templateId,
    })

    navigate(`/section-builder?${q.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <h1 className="text-2xl font-bold text-white">Start Question Paper</h1>
          <p className="text-blue-100 dark:text-blue-200 mt-1 transition-colors">Choose course, exam type and template.</p>
        </div>
        {error && <div className="px-6 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30 transition-colors">{error}</div>}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-5 transition-colors">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
            >
              <option value="">-- Select course --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.courseId} — {c.title}
                </option>
              ))}
            </select>
            {selectedCourse && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                Code: {selectedCourse.code} | Dept: {selectedCourse.department || '-'} | Semester: {selectedCourse.semester || '-'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Exam Type</label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setExamType('internal')}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all border-2 ${examType === 'internal'
                    ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                Internal
              </button>
              <button
                type="button"
                onClick={() => setExamType('end_sem')}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all border-2 ${examType === 'end_sem'
                    ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                End Semester
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
            >
              <option value="">-- Select template --</option>
              {filteredTemplates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.isDefault ? '[Default] ' : ''}{t.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 transition-colors">Only approved templates are shown.</p>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-md bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Continue to Section Builder
          </button>
        </div>
      )}
    </div>
  )
}

export default ExamMode