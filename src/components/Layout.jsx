import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useThemeStore, useUIStore } from '../store'
import Header from './Header'
import Sidebar from './Sidebar'

function Layout() {
  const { sidebarOpen, closeSidebar } = useUIStore()
  const { isAuthenticated } = useAuthStore()
  const { theme } = useThemeStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
      {/* Header */}
      <Header />

      <div>
        {/* Sidebar - only show when authenticated, mobile only (slides in/out) */}
        {isAuthenticated && (
          <>
            {/* Mobile overlay */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={closeSidebar}
                />
              )}
            </AnimatePresence>

            {/* Sidebar - always fixed, slides in when open */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-800 shadow-lg"
                >
                  <Sidebar />
                </motion.aside>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main content - always centered */}
        <main className="min-h-screen w-full">
          <div className="max-w-[1200px] mx-auto px-4 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
