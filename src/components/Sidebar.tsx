'use client'

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, Chrome as Home, Users, MapPin, Settings, X, UserCheck } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { cn } from '@/lib/utils'
import { Database } from '@/lib/database.types'

type UserRole = Database['public']['Enums']['user_role']

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles?: UserRole[]
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  {
    name: 'Kunder',
    href: '/customers',
    icon: Users,
    roles: ['admin', 'customer_responsible', 'location_responsible']
  },
  { name: 'Lokationer', href: '/locations', icon: MapPin },
  {
    name: 'Team',
    href: '/colleagues',
    icon: UserCheck,
    roles: ['admin', 'customer_responsible', 'location_responsible']
  },
  { name: 'Indstillinger', href: '/settings', icon: Settings },
]

interface SidebarProps {
  isMobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
  isClosing?: boolean
}

function CompanyBrand({ logoUrl, name }: { logoUrl?: string | null; name?: string | null }) {
  const [imageFailed, setImageFailed] = React.useState(false)
  const showLogo = !!logoUrl && !imageFailed
  const displayName = name && name.trim().length > 0 ? name : 'InfoBridge'

  return (
    <div className="flex items-center space-x-3 min-w-0">
      {showLogo ? (
        <div className="bg-white border border-gray-200 p-1.5 rounded-lg flex items-center justify-center h-10 w-10 shrink-0 overflow-hidden">
          <img
            src={logoUrl!}
            alt={`${displayName} logo`}
            className="h-full w-full object-contain"
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div className="bg-primary-500 p-2 rounded-lg shrink-0">
          <Building2 className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
      </div>
    </div>
  )
}

export function Sidebar({ isMobileMenuOpen = false, onMobileMenuClose, isClosing = false }: SidebarProps) {
  const location = useLocation()
  const { profile, company, reloadingProfile, user } = useAuth()

  // Add a small delay to ensure smooth opening animation
  const [shouldAnimate, setShouldAnimate] = React.useState(false)

  const lastRoleRef = React.useRef<UserRole | null>(null)
  React.useEffect(() => {
    if (profile?.role) lastRoleRef.current = profile.role
  }, [profile?.role])

  const effectiveRole: UserRole | null =
    profile?.role ?? (reloadingProfile || !profile ? lastRoleRef.current : null)

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true
    if (effectiveRole) return item.roles.includes(effectiveRole)
    // While signed in but role is transiently unknown, keep role-gated items
    if (user && (reloadingProfile || !profile)) return true
    return false
  })
  
  React.useEffect(() => {
    if (isMobileMenuOpen && !isClosing) {
      // Small delay to ensure component is mounted before animation starts
      const timer = setTimeout(() => setShouldAnimate(true), 10)
      return () => clearTimeout(timer)
    } else {
      setShouldAnimate(false)
    }
  }, [isMobileMenuOpen, isClosing])

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <CompanyBrand logoUrl={company?.logo_url} name={company?.name} />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={cn(
                            isActive
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {(isMobileMenuOpen || isClosing) && (
        <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}>
          {/* Backdrop with blur */}
          <div 
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={onMobileMenuClose}
          />
          
          {/* Sliding Menu */}
          <div className="fixed inset-y-0 left-0 right-4 sm:right-6 flex z-10">
            <div className={`relative flex w-full max-w-xs flex-col bg-white shadow-xl transform transition-all duration-300 ${
              isClosing || !shouldAnimate
                ? '-translate-x-full opacity-0 ease-in' 
                : 'translate-x-0 opacity-100 ease-out'
            }`}>
              {/* Close button */}
              <div className={`absolute top-0 right-0 -mr-12 pt-2 transition-all duration-300 ${
                isClosing || !shouldAnimate
                  ? 'opacity-0 scale-90' 
                  : 'opacity-100 scale-100 delay-150'
              }`}>
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
                  onClick={onMobileMenuClose}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>

              {/* Menu content */}
              <div className={`flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 transform transition-all duration-300 ${
                isClosing || !shouldAnimate
                  ? '-translate-x-4 opacity-0 ease-in' 
                  : 'translate-x-0 opacity-100 ease-out delay-100'
              }`}>
                <div className="flex h-16 shrink-0 items-center">
                  <CompanyBrand logoUrl={company?.logo_url} name={company?.name} />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {filteredNavigation.map((item) => {
                          const isActive = location.pathname === item.href
                          return (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                onClick={onMobileMenuClose}
                                className={cn(
                                  isActive
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                                    'h-6 w-6 shrink-0'
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Legacy component for backward compatibility
export function DesktopSidebar() {
  const location = useLocation()
  const { company } = useAuth()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <CompanyBrand logoUrl={company?.logo_url} name={company?.name} />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          isActive
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}