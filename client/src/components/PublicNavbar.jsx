import React from 'react'
import { Link } from 'react-router-dom'
import LightLogo from '../assets/Light_logo.png'
import ThemeToggle from './ThemeToggle'

function PublicNavbar() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center h-full">
            <img
              src={LightLogo}
              alt="QP Generator logo"
              className="h-34 w-auto max-h-full object-contain"
            />
          </Link>

          {/* Auth Links */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default PublicNavbar
