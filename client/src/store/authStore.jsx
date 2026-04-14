import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiRequest } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [facultyUsers, setFacultyUsers] = useState([])

  const bootstrap = useCallback(async () => {
    try {
      const data = await apiRequest('/api/auth/me')
      setCurrentUser(data?.user || null)
    } catch {
      setCurrentUser(null)
    } finally {
      setAuthReady(true)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const refreshPendingFaculty = useCallback(async () => {
    const data = await apiRequest('/api/admin/faculty/pending')
    const pending = data?.users || []
    setFacultyUsers((prev) => {
      const approved = (prev || []).filter((u) => u.status === 'approved')
      return [...pending, ...approved]
    })
    return pending
  }, [])

  const signup = useCallback(async ({ email, password, role, firstName, lastName }) => {
    try {
      const data = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: { email, password, role, firstName, lastName },
      })
      setCurrentUser(data?.user || null)
      return { success: true, user: data?.user }
    } catch (err) {
      return { success: false, error: err?.message || 'Sign up failed.' }
    }
  }, [])

  const login = useCallback(async (email, password, expectedRole) => {
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      const user = data?.user || null
      if (expectedRole && user?.role && user.role !== expectedRole) {
        try {
          await apiRequest('/api/auth/logout', { method: 'POST' })
        } catch {
        }
        setCurrentUser(null)
        return { success: false, error: `This account is not a ${expectedRole} account.` }
      }

      setCurrentUser(user)
      if (user?.role === 'admin') {
        try {
          await refreshPendingFaculty()
        } catch {
        }
      }

      return { success: true, user }
    } catch (err) {
      const status = err?.data?.status
      return { success: false, error: err?.message || 'Login failed.', status }
    }
  }, [refreshPendingFaculty])

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' })
    } catch {
    }
    setCurrentUser(null)
    setFacultyUsers([])
  }, [])

  const verifyAdminByToken = useCallback(async (token) => {
    if (!token || typeof token !== 'string') return false
    try {
      await apiRequest(`/api/auth/verify-admin?token=${encodeURIComponent(token)}`)
      return true
    } catch {
      return false
    }
  }, [])

  const getPendingFaculty = useCallback(() => {
    return (facultyUsers || []).filter((u) => u.role === 'faculty' && u.status === 'pending_admin_approval')
  }, [facultyUsers])

  const approveFaculty = useCallback(async (id) => {
    await apiRequest(`/api/admin/faculty/${id}/approve`, { method: 'POST' })
    setFacultyUsers((prev) =>
      (prev || []).map((u) => (u._id === id || u.id === id ? { ...u, status: 'approved' } : u))
    )
  }, [])

  const value = {
    currentUser,
    authReady,
    signup,
    login,
    logout,
    verifyAdminByToken,
    getPendingFaculty,
    approveFaculty,
    refreshPendingFaculty,
    users: facultyUsers,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
