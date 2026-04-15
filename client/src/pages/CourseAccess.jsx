import React, { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from '../store/authStore'

function CourseAccess() {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [courses, setCourses] = useState([])

  const [institutionId, setInstitutionId] = useState('')

  const [instName, setInstName] = useState('')
  const [instCode, setInstCode] = useState('')

  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDept, setCourseDept] = useState('')
  const [courseProgram, setCourseProgram] = useState('')
  const [courseSemester, setCourseSemester] = useState('')
  const [courseCredits, setCourseCredits] = useState('')

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const selectedCourse = useMemo(
    () => (courses || []).find((c) => c._id === selectedCourseId) || null,
    [courses, selectedCourseId],
  )

  const [syllabusVersion, setSyllabusVersion] = useState('2024-2025')
  const [syllabusPdf, setSyllabusPdf] = useState(null)

  const [noteUnitNumber, setNoteUnitNumber] = useState('1')
  const [noteTitle, setNoteTitle] = useState('Unit 1 Notes')
  const [notePdf, setNotePdf] = useState(null)

  async function loadAll() {
    setError('')
    setLoading(true)
    try {
      if (isAdmin) {
        const instRes = await apiRequest('/api/institutions')
        const insts = instRes?.items || []
        setInstitutions(insts)

        const preferred = institutionId || insts?.[0]?._id || ''
        setInstitutionId(preferred)
        const coursesRes = await apiRequest(`/api/courses${preferred ? `?institutionId=${encodeURIComponent(preferred)}` : ''}`)
        setCourses(coursesRes?.items || [])
      } else {
        const coursesRes = await apiRequest('/api/courses')
        setCourses(coursesRes?.items || [])
      }
    } catch (err) {
      setError(err?.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      await loadAll()
      if (cancelled) return
    }
    run()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    if (!institutionId) return

    let cancelled = false
    async function run() {
      try {
        const coursesRes = await apiRequest(`/api/courses?institutionId=${encodeURIComponent(institutionId)}`)
        if (!cancelled) setCourses(coursesRes?.items || [])
      } catch {
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [institutionId, isAdmin])

  const handleCreateInstitution = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await apiRequest('/api/institutions', {
        method: 'POST',
        body: { name: instName, code: instCode },
      })
      setInstName('')
      setInstCode('')
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Failed to create institution.')
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await apiRequest('/api/courses', {
        method: 'POST',
        body: {
          institutionId,
          code: courseCode,
          title: courseTitle,
          department: courseDept,
          program: courseProgram,
          semester: courseSemester ? Number(courseSemester) : undefined,
          credits: courseCredits ? Number(courseCredits) : undefined,
        },
      })

      setCourseCode('')
      setCourseTitle('')
      setCourseDept('')
      setCourseProgram('')
      setCourseSemester('')
      setCourseCredits('')

      await loadAll()
    } catch (err) {
      setError(err?.message || 'Failed to create course.')
    }
  }

  const handleUploadSyllabus = async (e) => {
    e.preventDefault()
    setError('')
    if (!selectedCourseId) {
      setError('Select a course first.')
      return
    }
    if (!syllabusPdf) {
      setError('Select a syllabus PDF first.')
      return
    }

    try {
      const fd = new FormData()
      fd.append('pdf', syllabusPdf)
      fd.append('courseId', selectedCourseId)
      fd.append('version', syllabusVersion)
      
      console.log('[UPLOAD START]: /api/uploads/syllabus', {
        courseId: selectedCourseId,
        version: syllabusVersion,
        fileName: syllabusPdf.name
      })

      const res = await apiRequest('/api/uploads/syllabus', { method: 'POST', body: fd })
      alert('Syllabus uploaded and extracted successfully!')
      setSyllabusPdf(null)
    } catch (err) {
      console.error('[UPLOAD FAILED]:', err)
      setError(err?.message || 'Failed to upload syllabus.')
    }
  }

  const handleUploadNotes = async (e) => {
    e.preventDefault()
    setError('')
    if (!selectedCourseId) {
      setError('Select a course first.')
      return
    }
    if (!notePdf) {
      setError('Select a notes PDF first.')
      return
    }

    try {
      const fd = new FormData()
      fd.append('pdf', notePdf)
      fd.append('courseId', selectedCourseId)
      fd.append('unitNumber', noteUnitNumber)
      fd.append('title', noteTitle)
      await apiRequest('/api/uploads/notes', { method: 'POST', body: fd })
      setNotePdf(null)
    } catch (err) {
      setError(err?.message || 'Failed to upload notes.')
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure? This will delete the course, syllabus, and all notes.')) return
    try {
      await apiRequest(`/api/courses/${courseId}`, { method: 'DELETE' })
      if (selectedCourseId === courseId) setSelectedCourseId('')
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Failed to delete course.')
    }
  }

  const handleClearAllCourses = async () => {
    if (!window.confirm('⚠️ DANGER: This will delete ALL courses and ALL related data in the system. Proceed?')) return
    try {
      await apiRequest('/api/courses', { method: 'DELETE' })
      setSelectedCourseId('')
      setCourses([])
      await loadAll()
    } catch (err) {
      setError(err?.message || 'Failed to clear courses.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800">
          <h1 className="text-2xl font-bold text-white">Courses & Uploads</h1>
          <p className="text-blue-100 dark:text-blue-200 mt-1 transition-colors">
            {isAdmin
              ? 'Create institutions/courses and upload syllabus + notes PDFs.'
              : 'Browse available courses.'}
          </p>
        </div>
        {error && <div className="px-6 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30">{error}</div>}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isAdmin && (
              <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Institution</h2>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Institution</label>
                    <select
                      value={institutionId}
                      onChange={(e) => setInstitutionId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                    >
                      <option value="">-- Select --</option>
                      {institutions.map((i) => (
                        <option key={i._id} value={i._id}>
                          {i.name} ({i.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Refresh</label>
                    <button
                      type="button"
                      onClick={() => loadAll()}
                      className="mt-1 w-full rounded-md bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                    >
                      Reload
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreateInstitution} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institution Name</label>
                    <input
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="Example Institute"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institution Code</label>
                    <input
                      value={instCode}
                      onChange={(e) => setInstCode(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="INST"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      className="w-full rounded-md bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700"
                    >
                      Create Institution
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Courses</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{courses.length} total</span>
              </div>

              <div className="mt-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Course</label>
                    <div className="flex gap-2 items-start mt-1">
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      >
                        <option value="">-- Select --</option>
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.courseId} — {c.title}
                          </option>
                        ))}
                      </select>
                      {isAdmin && selectedCourseId && (
                        <button
                          onClick={() => handleDeleteCourse(selectedCourseId)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/30 transition-colors"
                          title="Delete selected course"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {selectedCourse && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Code: {selectedCourse.code} | Dept: {selectedCourse.department || '-'} | Semester:{' '}
                    {selectedCourse.semester || '-'}
                  </p>
                )}
              </div>

              {isAdmin && (
                <form onSubmit={handleCreateCourse} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Code</label>
                    <input
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="CS201"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Title</label>
                    <input
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="Data Structures"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <input
                      value={courseDept}
                      onChange={(e) => setCourseDept(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="CSE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Program</label>
                    <input
                      value={courseProgram}
                      onChange={(e) => setCourseProgram(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="B.Tech"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Semester</label>
                    <input
                      value={courseSemester}
                      onChange={(e) => setCourseSemester(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Credits</label>
                    <input
                      value={courseCredits}
                      onChange={(e) => setCourseCredits(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="4"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full rounded-md bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700"
                    >
                      Create Course
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Syllabus PDF</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Admin-only. Uploads are extracted and chunked automatically.</p>

              <form onSubmit={handleUploadSyllabus} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
                  <input
                    value={syllabusVersion}
                    onChange={(e) => setSyllabusVersion(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setSyllabusPdf(file)
                    }}
                    className="mt-1 w-full text-sm text-gray-700 dark:text-gray-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isAdmin}
                  className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-colors ${isAdmin ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    }`}
                >
                  Upload Syllabus
                </button>
              </form>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Notes PDF</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload unit-wise notes PDFs.</p>

              <form onSubmit={handleUploadNotes} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Number</label>
                  <input
                    value={noteUnitNumber}
                    onChange={(e) => setNoteUnitNumber(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setNotePdf(e.target.files?.[0] || null)}
                    className="mt-1 w-full text-sm text-gray-700 dark:text-gray-300"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upload Notes
                </button>
              </form>
            </section>

            {isAdmin && (
              <section className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-dashed border-red-200 dark:border-red-900/30 p-6 transition-colors">
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Danger Zone
                </h2>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
                  Permanently clear all data for a fresh start.
                </p>
                <button
                  onClick={handleClearAllCourses}
                  className="mt-4 w-full rounded-md bg-red-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Clear All Courses & Data
                </button>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseAccess