import React from 'react'
import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Text and CTA */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white transition-colors leading-tight">
              Smart Question Paper Generator
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 transition-colors">
              Create custom exams with ease and efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="px-8 py-3 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition-colors text-center"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border-2 border-blue-500 text-blue-600 font-medium rounded-md hover:bg-blue-50 transition-colors text-center"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Side: Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 rounded-lg p-8 shadow-xl transition-colors">
              {/* Desktop Monitor */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4 transition-colors">
                <div className="bg-gray-100 dark:bg-gray-700 rounded h-48 flex flex-col items-center justify-center space-y-4 transition-colors">
                  {/* Lightbulb Icon */}
                  <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>

                  {/* Checkboxes */}
                  <div className="flex space-x-4">
                    <div className="w-6 h-6 bg-orange-500 rounded border-2 border-orange-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
                    <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
                  </div>

                  {/* Bar Charts */}
                  <div className="flex items-end space-x-2">
                    <div className="w-4 bg-blue-500 h-8 rounded-t"></div>
                    <div className="w-4 bg-blue-500 h-12 rounded-t"></div>
                    <div className="w-4 bg-blue-500 h-6 rounded-t"></div>
                    <div className="w-4 bg-blue-500 h-10 rounded-t"></div>
                  </div>
                </div>
              </div>

              {/* People Illustration */}
              <div className="flex items-end justify-between px-4">
                {/* Person with clipboard */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mb-2 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-12 h-20 bg-blue-400 rounded-t-full"></div>
                </div>

                {/* Person with laptop */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full mb-2 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="w-10 h-16 bg-orange-400 rounded-t-full"></div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4">
                <svg className="w-8 h-8 text-gray-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="absolute bottom-4 left-4">
                <svg className="w-6 h-6 text-gray-300 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
