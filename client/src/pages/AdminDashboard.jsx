import React, { useEffect, useState } from 'react'
import { useAuth } from '../store/authStore'

function AdminDashboard() {
  const { getPendingFaculty, approveFaculty, users, refreshPendingFaculty } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        await refreshPendingFaculty()
      } catch {
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [refreshPendingFaculty])

  const pendingFaculty = getPendingFaculty()
  const verifiedFaculty = (users || []).filter((u) => u.role === 'faculty' && u.status === 'approved')

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-700 to-slate-800">
          <h1 className="text-2xl font-bold text-white">Admin (HOD) Dashboard</h1>
          <p className="text-slate-200 mt-1">Manage faculty and question paper workflows.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{pendingFaculty.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending faculty</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{verifiedFaculty.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verified faculty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Faculty verification */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pending Faculty</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Faculty who signed up are listed below. Verify them to allow login.
          </p>
        </div>
        <div className="p-4">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : pendingFaculty.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No pending faculty at the moment.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingFaculty.map((user) => (
                <li key={user._id || user.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white transition-colors">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => approveFaculty(user._id || user.id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Verify (Approve)
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
