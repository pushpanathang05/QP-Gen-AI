import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/authStore'

function VerifyAdmin() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || searchParams.get('email') || ''
  const { verifyAdminByToken } = useAuth()
  const [status, setStatus] = useState('checking') // 'checking' | 'success' | 'invalid'

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!token) {
        setStatus('invalid')
        return
      }
      try {
        const decoded = decodeURIComponent(token)
        const ok = await verifyAdminByToken(decoded)
        if (!cancelled) setStatus(ok ? 'success' : 'invalid')
      } catch {
        if (!cancelled) setStatus('invalid')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [token, verifyAdminByToken])

  if (status === 'checking') {
    return (
      <div className="min-h-[calc(100vh-4rem-16rem)] flex items-center justify-center px-4">
        <p className="text-gray-600">Verifying your email...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-[calc(100vh-4rem-16rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-red-100 text-center">
          <h2 className="text-xl font-bold text-gray-900">Invalid or expired link</h2>
          <p className="mt-2 text-sm text-gray-600">
            This verification link is invalid or has expired. Please sign up again or request a new link.
          </p>
          <Link
            to="/login?role=admin"
            className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem-16rem)] flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="max-w-md w-full bg-white/80 backdrop-blur shadow-xl rounded-2xl p-8 border border-blue-50 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Email verified</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your Admin (HOD) account is now active. You can log in and access the dashboard.
        </p>
        <Link
          to="/login?role=admin"
          className="mt-6 inline-block w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Log in as Admin (HOD)
        </Link>
      </div>
    </div>
  )
}

export default VerifyAdmin
