import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LightLogo from '../assets/Light_logo.png'
import { useAuth } from '../store/authStore'
import ThemeToggle from './ThemeToggle'

function DashboardNavbar({ onToggleSidebar }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate(currentUser?.role === 'admin' ? '/login?role=admin' : '/login?role=faculty')
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 transition-colors z-40 relative">
      <div className="px-6">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-6">
            {/* Hamburger Menu */}
            <button
              onClick={onToggleSidebar}
              className="p-2.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link
              to={currentUser?.role === 'admin' ? '/admin-dashboard' : '/faculty-dashboard'}
              className="flex items-center h-full"
            >
              <img
                src={LightLogo}
                alt="QP Generator logo"
                className="h-42 w-auto max-h-full object-contain"
              />
            </Link>
          </div>

          {/* User Menu Area */}
          <div className="flex items-center space-x-6">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                  <Link
                    to={currentUser?.role === 'admin' ? '/admin-dashboard' : '/faculty-dashboard'}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/history"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    History
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default DashboardNavbar
