'use client'

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Settings, LogOut, Globe, Menu, Building2, Shield } from 'lucide-react'
import { getRoleLabel, getRoleColor } from '@/lib/permissions'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, profile, company, signOut, reloadingProfile } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const metaFullName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name
  const displayName =
    profile?.full_name?.trim() ||
    metaFullName ||
    user?.email ||
    'User'
  const avatarInitial = (
    profile?.full_name?.trim()?.charAt(0) ||
    metaFullName?.charAt(0) ||
    user?.email?.charAt(0) ||
    'U'
  ).toUpperCase()

  const handleSignOut = async () => {
    try {
      setDropdownOpen(false)
      console.log('Header: Starting sign out process...')
      await signOut()
      console.log('Header: Sign out completed, navigating to login...')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Header: Error during sign out:', error)
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex flex-1 items-center gap-3">
          {company && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{company.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Profile dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center space-x-3 p-2 hover:bg-primary-50 hover:text-primary-700"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-100 text-primary-600">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex lg:flex-col lg:items-start lg:gap-1">
                <span className="text-sm font-semibold text-gray-900 max-w-[180px] truncate">
                  {displayName}
                </span>
                {profile?.role ? (
                  <Badge className={`${getRoleColor(profile.role)} text-xs h-5 px-1.5`}>
                    {profile.role === 'admin' && <Shield className="w-3 h-3 mr-0.5" />}
                    {getRoleLabel(profile.role)}
                  </Badge>
                ) : reloadingProfile ? (
                  <span className="text-[10px] text-gray-400">Reconnecting…</span>
                ) : null}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>

            {dropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">{user?.email}</p>
                  {profile?.role && (
                    <Badge className={`${getRoleColor(profile.role)} text-xs`}>
                      {profile.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {getRoleLabel(profile.role)}
                    </Badge>
                  )}
                  {company && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{company.name}</span>
                    </div>
                  )}
                </div>

                <Link
                  to="/settings"
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>

                <div className="border-t border-gray-100">
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    type="button"
                  >
                    <Globe className="mr-3 h-4 w-4" />
                    Language: English 🇬🇧
                  </button>
                </div>

                <div className="border-t border-gray-100">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    type="button"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Log ud
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}