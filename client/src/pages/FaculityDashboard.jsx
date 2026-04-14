import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/authStore'

const quickActions = [
  {
    title: 'Create Question Paper',
    description: 'Build a new question paper using the section builder.',
    href: '/exam-mode',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'bg-blue-500',
  },
  {
    title: 'Templates',
    description: 'Use or manage question paper templates.',
    href: '/templates',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    color: 'bg-emerald-500',
  },
  {
    title: 'History',
    description: 'View and manage your past question papers.',
    href: '/history',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-amber-500',
  },
  {
    title: 'Course Access',
    description: 'Manage course access and permissions.',
    href: '/course-access',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'bg-violet-500',
  },
]

function FaculityDashboard() {
  const { currentUser } = useAuth()
  const displayName = currentUser?.email?.split('@')[0] || 'Faculty'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-blue-100 dark:text-blue-200 mt-1">{displayName}</p>
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 transition-colors">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all p-5"
            >
              <div className={`inline-flex p-2 rounded-lg ${action.color} text-white mb-3`}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent / placeholder */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent activity</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your latest question papers and actions.</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity yet. Create your first question paper to get started.</p>
        </div>
      </section>
    </div>
  )
}

export default FaculityDashboard
