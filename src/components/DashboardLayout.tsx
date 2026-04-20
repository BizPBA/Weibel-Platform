'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleMenuClick = () => {
    if (!isMobileMenuOpen && !isClosing) {
      setIsClosing(false)
      setIsMobileMenuOpen(true)
    }
  }

  const handleMobileMenuClose = () => {
    if (isClosing) return // Prevent multiple close attempts
    
    setIsClosing(true)
    // Delay the actual close to allow animation to complete
    setTimeout(() => {
      if (isMobileMenuOpen) { // Only close if still open
        setIsMobileMenuOpen(false)
        setIsClosing(false)
      }
    }, 300) // Match animation duration
  }

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={handleMobileMenuClose}
        isClosing={isClosing}
      />
      <div className="lg:pl-64">
        <Header onMenuClick={handleMenuClick} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}