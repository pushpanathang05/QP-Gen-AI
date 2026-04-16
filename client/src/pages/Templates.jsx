import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from '../store/authStore'

function Templates() {
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')

  const [items, setItems] = useState([])

  const [name, setName] = useState('')
  const [type, setType] = useState('internal')
  const [description, setDescription] = useState('')
  
  // Specific Form Config for University Guidelines
  const [degreeTitle, setDegreeTitle] = useState('B.E./B.Tech. DEGREE EXAMINATIONS')
  const [regulation, setRegulation] = useState('(Regulations 2021)')
  const [examTime, setExamTime] = useState('Three Hours')
  const [maxMarks, setMaxMarks] = useState('100')
  const [instructions, setInstructions] = useState(['Answer ALL questions'])
  
  const [sections, setSections] = useState([
    { sectionId: 'PART-A', title: 'Part A', questionsCount: 10, marksPerQuestion: 2 }
  ])

  const addSection = () => setSections([...sections, { sectionId: '', title: '', questionsCount: 1, marksPerQuestion: 1 }])
  const updateSection = (idx, field, val) => {
    const newSecs = [...sections]
    newSecs[idx][field] = val
    setSections(newSecs)
  }
  const removeSection = (idx) => setSections(sections.filter((_, i) => i !== idx))

  const applyTenQuestionPreset = () => {
    setDegreeTitle('B.E./B.Tech. DEGREE EXAMINATIONS')
    setRegulation('(Regulations 2021)')
    setExamTime('Three Hours')
    setMaxMarks('100')
    setInstructions(['Answer ALL questions'])
    setSections([
      { sectionId: 'PART-A', title: 'Part A (10 x 2 = 20 Marks)', questionsCount: 10, marksPerQuestion: 2 }
    ])
  }

  const addInstruction = () => setInstructions([...instructions, ''])
  const updateInstruction = (idx, val) => {
    const newInst = [...instructions]
    newInst[idx] = val
    setInstructions(newInst)
  }
  const removeInstruction = (idx) => {
    setInstructions(instructions.filter((_, i) => i !== idx))
  }

  const filteredTemplates = useMemo(() => {
    if (!institutionId) return items
    return (items || []).filter((t) => String(t.institutionId) === String(institutionId))
  }, [items, institutionId])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      if (isAdmin) {
        const instRes = await apiRequest('/api/institutions')
        const insts = instRes?.items || []
        setInstitutions(insts)
        if (!institutionId && insts?.[0]?._id) setInstitutionId(insts[0]._id)
      }

      const query = isAdmin ? '' : '?status=approved'
      const res = await apiRequest(`/api/templates${query}`)
      setItems(res?.items || [])
    } catch (err) {
      setError(err?.message || 'Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }, [institutionId, isAdmin])

  useEffect(() => {
    let cancelled = false
    async function run() {
      await load()
      if (cancelled) return
    }
    run()
    return () => {
      cancelled = true
    }
  }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')

    if (!isAdmin) return
    if (!institutionId) {
      setError('Select an institution first.')
      return
    }

    const format = {
      header: { degreeTitle, regulation },
      examDetails: { time: examTime, maxMarks },
      instructions: instructions.filter((i) => i.trim() !== ''),
      sections: sections.map(s => ({
        ...s,
        questionsCount: Number(s.questionsCount),
        marksPerQuestion: Number(s.marksPerQuestion)
      }))
    }

    try {
      await apiRequest('/api/templates', {
        method: 'POST',
        body: { institutionId, name, description, type, format },
      })
      setName('')
      setDescription('')
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to create template.')
    }
  }

  const approve = async (id) => {
    setError('')
    try {
      await apiRequest(`/api/templates/${id}/approve`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to approve template.')
    }
  }

  const setDefault = async (id) => {
    setError('')
    try {
      await apiRequest(`/api/templates/${id}/set-default`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to set default template.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-900">
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-slate-200 dark:text-slate-300 mt-1 transition-colors">
            {isAdmin ? 'Create and approve templates.' : 'Browse approved templates.'}
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
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Template List</h2>
                <button
                  type="button"
                  onClick={() => load()}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                >
                  Reload
                </button>
              </div>

              {isAdmin && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institution</label>
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
              )}

              <div className="p-4">
                {filteredTemplates.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No templates yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTemplates.map((t) => (
                      <li key={t._id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white transition-colors">{t.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Type: {t.type} | Status: {t.status} | Default: {t.isDefault ? 'Yes' : 'No'}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            {t.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => approve(t._id)}
                                className="px-3 py-2 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                            )}
                            {t.status === 'approved' && !t.isDefault && (
                              <button
                                type="button"
                                onClick={() => setDefault(t._id)}
                                className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                              >
                                Set Default
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create Template</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Define metadata and sections.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={applyTenQuestionPreset}
                    className="px-2 py-1 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 transition"
                  >
                    10-Question Preset
                  </button>
                </div>

                <form onSubmit={handleCreate} className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="Internal Template - CSE"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                    >
                      <option value="internal">Internal</option>
                      <option value="end_sem">End Semester</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                      placeholder="NAAC-ready format"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Header Structure</h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Degree / Examination Title</label>
                        <input
                          value={degreeTitle}
                          onChange={(e) => setDegreeTitle(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                          placeholder="B.E. DEGREE EXAMINATIONS"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Regulation</label>
                        <input
                          value={regulation}
                          onChange={(e) => setRegulation(e.target.value)}
                          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                          placeholder="(Regulations 2021)"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Exam Time</label>
                          <input
                            value={examTime}
                            onChange={(e) => setExamTime(e.target.value)}
                            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                            placeholder="Three Hours"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Maximum Marks</label>
                          <input
                            value={maxMarks}
                            onChange={(e) => setMaxMarks(e.target.value)}
                            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                            placeholder="100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Sections (Parts)</h3>
                      <button type="button" onClick={addSection} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        + Add Part
                      </button>
                    </div>
                    <div className="space-y-3">
                      {sections.map((sec, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">PART {idx + 1}</span>
                            <button type="button" onClick={() => removeSection(idx)} className="text-red-500 hover:text-red-700">
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              placeholder="ID (A, B...)"
                              value={sec.sectionId}
                              onChange={(e) => updateSection(idx, 'sectionId', e.target.value)}
                              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Title (Part A...)"
                              value={sec.title}
                              onChange={(e) => updateSection(idx, 'title', e.target.value)}
                              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-gray-500">Q. Count</label>
                              <input
                                type="number"
                                value={sec.questionsCount}
                                onChange={(e) => updateSection(idx, 'questionsCount', e.target.value)}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-gray-500">Marks/Q</label>
                              <input
                                type="number"
                                value={sec.marksPerQuestion}
                                onChange={(e) => updateSection(idx, 'marksPerQuestion', e.target.value)}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700"
                  >
                    Create Template
                  </button>
                </form>
              </div>
            )}

            {!isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Templates are managed by Admin (HOD).</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Templates