import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'

function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const roleFromUrl = searchParams.get('role') // 'admin' | 'faculty'
  const [role, setRole] = useState(roleFromUrl === 'faculty' ? 'faculty' : 'admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password, role)
    if (!result.success) {
      setError(result.error || 'Login failed.')
      return
    }
    if (role === 'admin') navigate('/admin-dashboard')
    else navigate('/faculty-dashboard')
  }

  const isAdmin = role === 'admin'

  return (
    <div className="min-h-[calc(100vh-4rem-16rem)] flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-950 dark:to-slate-900 px-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-xl rounded-2xl p-8 border border-blue-50 dark:border-gray-700 transition-colors">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
            {isAdmin ? 'Admin (HOD) Login' : 'Faculty Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isAdmin
              ? 'Sign in to manage faculty accounts and access admin features.'
              : 'Sign in to create and manage question papers.'}
          </p>
        </div>

        {/* Role selection */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am logging in as</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all border-2 ${role === 'admin'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Admin (HOD)
            </button>
            <button
              type="button"
              onClick={() => setRole('faculty')}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all border-2 ${role === 'faculty'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              Faculty
            </button>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-400">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <button
                type="button"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors"
          >
            {isAdmin ? 'Login as Admin' : 'Login as Faculty'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login