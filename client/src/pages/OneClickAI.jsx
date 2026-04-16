import React, { useState, useEffect } from 'react'
import { apiRequest } from '../services/api'

const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5005').replace(/\/$/, '')

function OneClickAI() {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [health, setHealth] = useState({ database: 'checking', aiService: 'checking' })

  useEffect(() => {
    fetchCourses()
    checkHealth()
    const timer = setInterval(checkHealth, 30000) // Re-check every 30s
    return () => clearInterval(timer)
  }, [])

  const checkHealth = async () => {
    try {
      const data = await apiRequest('/api/courses/health')
      setHealth(data)
    } catch (err) {
      setHealth({ database: 'offline', aiService: 'offline' })
    }
  }

  const fetchCourses = async () => {
    try {
      const data = await apiRequest('/api/courses')
      const items = data.items || []
      // Show ALL courses (don't filter hasSyllabus here)
      setCourses(items)
    } catch (err) {
      setError('Failed to load courses.')
    }
  }

  const handleMagicGenerate = async () => {
    if (!selectedCourseId) {
      setError('Please select a course first.')
      return
    }

    const course = courses.find(c => c._id === selectedCourseId)
    if (!course?.hasSyllabus) {
      setError('This course has no syllabus! Please upload one in the Course Access page first.')
      return
    }
    setError('')
    setLoading(true)
    setStatus('Analyzing syllabus and generating questions...')

    try {
      const payload = {
        courseId: selectedCourseId,
        code: course?.code,
        subject: course?.title,
        semester: course?.semester
      }

      const res = await fetch(`${API_BASE_URL}/api/generation/generate-au-paper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server Error Status:', res.status);
        console.group('Server Error Details');
        console.log('Raw Response:', errorText);
        
        let errorMessage = 'Internal Server Error';
        try {
          const errData = JSON.parse(errorText);
          console.log('Parsed Error Data:', errData);
          errorMessage = errData.error || errData.message || errorMessage;
        } catch (e) {
          console.warn('Response was not JSON. Using raw text.');
          errorMessage = errorText.slice(0, 200) || errorMessage;
        }
        console.groupEnd();
        throw new Error(errorMessage);
      }

      setStatus('Finalizing PDF formatting...')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AU_AI_Paper_${course?.code || 'Generated'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus('Success! Your paper is ready.')
    } catch (err) {
      setError(err.message || 'Failed to generate paper.')
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          One-Click AI Generation <span className="text-2xl">✨</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Transform your syllabus PDF into a professional Anna University paper in seconds.
        </p>
      </div>

      {/* System Health Status */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${health.database === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`}></div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">Database: {health.database.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${health.aiService === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'}`}></div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">AI Service: {health.aiService.toUpperCase()}</span>
          </div>
        </div>
        
        {health.aiService !== 'online' && (
          <div className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full font-bold border border-red-100 dark:border-red-900/30 uppercase">
            ⚠️ Start AI Service (Port 5001)
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden transition-all">
        <div className="p-8 space-y-6">
          {/* Course Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Course (with syllabus)
            </label>
              {courses.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <div className="flex-1 relative">
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      disabled={loading}
                      className="w-full h-12 pl-4 pr-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="">-- Choose a course --</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.title} {!course.hasSyllabus ? '⚠️ (No Syllabus)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={fetchCourses}
                    className="p-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors"
                    title="Refresh Courses"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

          {selectedCourseId && courses.find(c => c._id === selectedCourseId) && !courses.find(c => c._id === selectedCourseId).hasSyllabus && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/30">
              <div className="flex gap-3">
                <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-amber-800 dark:text-amber-300">Syllabus Missing</p>
                  <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                    This course is in our database, but we can't generate a paper without the syllabus content. 
                    Please upload the syllabus PDF in <b>Course Access</b>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Model Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex gap-3">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-blue-800 dark:text-blue-300">Intelligent BTL Engine Active</p>
                <p className="text-blue-700 dark:text-blue-400 mt-0.5">
                  Questions will be automatically balanced following Anna University norms (40% K1, 30% K2, 20% K3, 10% K4).
                </p>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-4">
            <button
              onClick={handleMagicGenerate}
              disabled={loading || !selectedCourseId}
              className={`w-full h-14 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${
                loading || !selectedCourseId
                  ? 'bg-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/25'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{status}</span>
                </>
              ) : (
                <>
                  <span>✨ Magic Generate Full Paper</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 animate-shake">
              <p className="text-sm text-red-700 dark:text-red-400 text-center font-medium">
                ⚠️ {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Unit-Wise Logic", desc: "Auto-detects 5 units from PDF" },
          { title: "AU Compliant", desc: "Official layout & BTL columns" },
          { title: "Offline AI", desc: "Minimal privacy risk" }
        ].map((item, i) => (
          <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{item.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OneClickAI
