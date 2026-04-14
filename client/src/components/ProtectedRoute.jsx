import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, authReady } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const roleFromPath = location.pathname.includes('admin') ? 'admin' : location.pathname.includes('faculty') ? 'faculty' : null
  const role = requiredRole || roleFromPath

  useEffect(() => {
    if (!authReady) return
    if (!currentUser) {
      navigate(role ? `/login?role=${role}` : '/login', { replace: true })
      return
    }
    if (requiredRole && currentUser.role !== requiredRole) {
      const dashboard = currentUser.role === 'admin' ? '/admin-dashboard' : '/faculty-dashboard'
      navigate(dashboard, { replace: true })
    }
  }, [authReady, currentUser, navigate, requiredRole, role])

  if (!authReady) return null
  if (!currentUser) return null
  if (requiredRole && currentUser.role !== requiredRole) return null
  return <>{children}</>
}

export default ProtectedRoute
