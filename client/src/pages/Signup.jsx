import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/authStore'

function Signup() {
  const [searchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role') // 'admin' | 'faculty'
  const [role, setRole] = useState(roleFromUrl === 'faculty' ? 'faculty' : 'admin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [signupResult, setSignupResult] = useState(null) // { role, user? } after successful signup
  const { signup } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSignupResult(null)
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }
    const result = await signup({
      email,
      password,
      role,
      firstName,
      lastName,
    })
    if (!result.success) {
      setError(result.error || 'Sign up failed.')
      return
    }
    setSignupResult({ role, user: result.user })
  }

  if (signupResult) {
    const isAdmin = signupResult.role === 'admin'
    return (
      <div className="min-h-[calc(100vh-4rem-16rem)] flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-950 dark:to-slate-900 px-4 py-12 transition-colors">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-xl rounded-2xl p-8 border border-blue-50 dark:border-gray-700 text-center transition-colors">
          {isAdmin ? (
            <>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white transition-colors">Check your email</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We&apos;ve sent a verification link to your email. Click &quot;Yes&quot; in that email to activate your Admin (HOD) account.
              </p>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                For demo: click the link below to verify (in production this would be the link in your email):
              </p>
              <Link
                to={`/verify-admin?token=${encodeURIComponent(signupResult.user?.id || signupResult.user?.email || '')}`}
                className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Yes — Verify my Admin account
              </Link>
              <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Back to Login</Link>
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white transition-colors">Pending verification</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your Faculty account has been created. An Admin (HOD) will verify you soon. You can log in after your account is approved.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  const isAdmin = role === 'admin'

  return (
    <div className="min-h-[calc(100vh-4rem-16rem)] flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-950 dark:to-slate-900 px-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-xl rounded-2xl p-8 border border-blue-50 dark:border-gray-700 transition-colors">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
            {isAdmin ? 'Create Admin (HOD) Account' : 'Create Faculty Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isAdmin
              ? 'Sign up as Admin (HOD) to manage and verify faculty accounts.'
              : 'Sign up as Faculty to create and manage question papers.'}
          </p>
        </div>

        {/* Role selection */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am signing up as</label>
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
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isAdmin ? 'Admin email' : 'Work email'}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
              placeholder={isAdmin ? 'admin@institution.edu' : 'you@institution.edu'}
              required
            />
            {isAdmin && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                You&apos;ll receive a verification email to activate your account.
              </p>
            )}
            {!isAdmin && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                An Admin (HOD) will verify your account before you can log in.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
              placeholder="Create a strong password"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors">
              Must be at least 8 characters, including a number and a symbol.
            </p>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
            />
            <label htmlFor="terms" className="ml-2 block text-xs text-gray-600 dark:text-gray-400 transition-colors">
              I agree to the{' '}
              <button type="button" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Terms of Service
              </button>{' '}
              and{' '}
              <button type="button" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Privacy Policy
              </button>
              .
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors"
          >
            {isAdmin ? 'Create Admin Account' : 'Create Faculty Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 transition-colors">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup