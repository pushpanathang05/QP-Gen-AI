import React, { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

function History() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPaper, setSelectedPaper] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await apiRequest('/api/papers')
      setPapers(res.items || [])
    } catch (err) {
      setError(err?.message || 'Failed to load history.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (paper) => {
    try {
      const payload = {
        title: paper.title,
        examType: paper.examType,
        course: {
          courseId: paper.metadata?.courseCode || paper.courseId?.courseId,
          code: paper.metadata?.courseCode || paper.courseId?.code,
          title: paper.metadata?.courseTitle || paper.courseId?.title,
        },
        template: {
          id: paper.templateId?._id || paper.templateId,
          name: paper.metadata?.templateName || paper.templateId?.name,
          format: paper.format,
        },
        sections: paper.sections,
      }

      const base = (import.meta?.env?.VITE_PDF_BASE_URL || 'http://localhost:8081').replace(/\/$/, '')
      const res = await fetch(`${base}/api/pdf/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('PDF generation failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${paper.title.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download PDF: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-700 dark:from-indigo-700 dark:to-violet-800">
          <h1 className="text-2xl font-bold text-white">Paper History</h1>
          <p className="text-indigo-100 dark:text-indigo-200 mt-1">View and Manage your previously generated question papers.</p>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paper Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {papers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No generated papers found in your history.
                  </td>
                </tr>
              ) : (
                papers.map((paper) => (
                  <tr key={paper._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(paper.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {paper.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {paper.metadata?.courseCode || paper.courseId?.code} - {paper.metadata?.courseTitle || paper.courseId?.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${paper.examType === 'end_sem'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                        {paper.examType === 'end_sem' ? 'End Sem' : 'Internal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => setSelectedPaper(paper)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDownload(paper)}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-colors"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedPaper(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-middle bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">
                  {selectedPaper.title}
                </h3>
                <button onClick={() => setSelectedPaper(null)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-8">
                  {selectedPaper.sections.map((section, si) => (
                    <div key={si} className="space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                        <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{section.title}</h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{section.questions.length} Questions</span>
                      </div>
                      <p className="text-sm italic text-gray-600 dark:text-gray-400">{section.instructions}</p>
                      <div className="space-y-6">
                        {section.questions.map((q, qi) => (
                          <div key={qi} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between mb-2">
                              <span className="font-bold text-gray-900 dark:text-white">Q{q.questionNumber}</span>
                              <div className="flex space-x-2">
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{q.btlLevel}</span>
                                <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded">{q.marks} Marks</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{q.questionText}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaper(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(selectedPaper)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default History