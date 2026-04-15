import React from 'react'
import { Routes, Route } from 'react-router-dom'
import PublicLayout from './Layouts/PublicLayout'
import DashboardLayout from './Layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import FaculityDashboard from './pages/FaculityDashboard'
import CourseAccess from './pages/CourseAccess'
import ExamMode from './pages/ExamMode'
import History from './pages/History'
import PreviewPaper from './pages/PreviewPaper'
import SectionBuilder from './pages/sectionBuilder'
import Templates from './pages/Templates'
import OneClickAI from './pages/OneClickAI'
import VerifyAdmin from './pages/VerifyAdmin'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-admin" element={<VerifyAdmin />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/faculty-dashboard" element={<ProtectedRoute><FaculityDashboard /></ProtectedRoute>} />
        <Route path="/course-access" element={<ProtectedRoute><CourseAccess /></ProtectedRoute>} />
        <Route path="/exam-mode" element={<ProtectedRoute><ExamMode /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/preview-paper" element={<ProtectedRoute><PreviewPaper /></ProtectedRoute>} />
        <Route path="/section-builder" element={<ProtectedRoute><SectionBuilder /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/one-click-ai" element={<ProtectedRoute><OneClickAI /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default App
