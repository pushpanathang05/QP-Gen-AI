import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar'
import SideBar from '../components/SideBar'
import Footer from '../components/Footer'

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      <SideBar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardNavbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6 text-gray-900 dark:text-gray-100 transition-all duration-300">
          <Outlet />
          <div className="mt-12">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout