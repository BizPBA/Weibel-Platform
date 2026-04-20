'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type RoleType = 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  company: Company | null
  loading: boolean
  reloadingProfile: boolean
  error: string | null
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isAdmin: boolean
  canManageCustomers: boolean
  canManageLocations: boolean
  canViewAllLocations: boolean
  needsOnboarding: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PROFILE_QUERY_TIMEOUT_MS = 10000
const RETRY_DELAYS_MS = [1000, 3000, 5000]

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadingProfile, setReloadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const profileChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const subscribedUserIdRef = useRef<string | null>(null)
  const initializedRef = useRef(false)
  const fetchingProfileRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)
  const profileRef = useRef<Profile | null>(null)
  const companyRef = useRef<Company | null>(null)
  const onlineRef = useRef<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    companyRef.current = company
  }, [company])

  const fetchCompany = useCallback(async (companyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle()

      if (!mountedRef.current) return false

      if (error) {
        console.warn('AuthProvider: Company fetch error (keeping last-known-good):', error.message)
        return false
      }

      if (data) {
        setCompany(data)
        return true
      }

      if (!companyRef.current) {
        setCompany(null)
      } else {
        console.warn('AuthProvider: Company query returned empty, keeping last-known-good')
      }
      return false
    } catch (err) {
      if (!mountedRef.current) return false
      console.warn('AuthProvider: Company fetch exception (keeping last-known-good):', err)
      return false
    }
  }, [])

  const queryProfileOnce = useCallback(async (userId: string) => {
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), PROFILE_QUERY_TIMEOUT_MS)
    )

    return Promise.race([queryPromise, timeoutPromise]) as Promise<{
      data: Profile | null
      error: { message: string; code?: string } | null
    }>
  }, [])

  const fetchProfile = useCallback(
    async (userId: string, options?: { isReload?: boolean }) => {
      if (fetchingProfileRef.current) return
      fetchingProfileRef.current = true

      const isReload = !!options?.isReload
      const hadProfile = !!profileRef.current

      if (isReload && hadProfile) {
        setReloadingProfile(true)
      }

      let succeeded = false

      try {
        const attempts = 1 + RETRY_DELAYS_MS.length
        for (let attempt = 0; attempt < attempts; attempt++) {
          if (!mountedRef.current) return
          if (currentUserIdRef.current !== userId) return

          try {
            const { data, error } = await queryProfileOnce(userId)

            if (!mountedRef.current) return
            if (currentUserIdRef.current !== userId) return

            if (error) {
              console.warn(
                `AuthProvider: Profile fetch error (attempt ${attempt + 1}/${attempts}):`,
                error.message
              )
            } else if (data) {
              setProfile(data)
              if (data.company_id) {
                await fetchCompany(data.company_id)
              } else {
                setCompany(null)
              }
              succeeded = true
              break
            } else {
              if (hadProfile) {
                console.warn(
                  `AuthProvider: Profile query returned empty (attempt ${attempt + 1}/${attempts}), keeping last-known-good`
                )
              } else {
                setProfile(null)
                setCompany(null)
                succeeded = true
                break
              }
            }
          } catch (err) {
            console.warn(
              `AuthProvider: Profile fetch exception (attempt ${attempt + 1}/${attempts}):`,
              err
            )
          }

          const delay = RETRY_DELAYS_MS[attempt]
          if (delay && onlineRef.current) {
            await sleep(delay)
          } else if (!onlineRef.current) {
            break
          }
        }

        if (!succeeded && !hadProfile && mountedRef.current) {
          setProfile(null)
          setCompany(null)
        }
      } finally {
        fetchingProfileRef.current = false
        if (mountedRef.current) {
          if (isReload) setReloadingProfile(false)
          if (!initializedRef.current) {
            setLoading(false)
            initializedRef.current = true
          }
        }
      }
    },
    [fetchCompany, queryProfileOnce]
  )

  const setupRealtimeSubscription = useCallback(
    (userId: string) => {
      if (subscribedUserIdRef.current === userId && profileChannelRef.current) {
        return
      }

      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current)
        profileChannelRef.current = null
      }

      subscribedUserIdRef.current = userId

      profileChannelRef.current = supabase
        .channel(`profile-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            if (!mountedRef.current) return
            if (currentUserIdRef.current !== userId) return

            if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedProfile = payload.new as Profile
              if (updatedProfile.id !== userId) return

              setProfile(updatedProfile)

              if (updatedProfile.company_id) {
                fetchCompany(updatedProfile.company_id)
              } else {
                setCompany(null)
              }
            } else if (payload.eventType === 'DELETE') {
              console.warn(
                'AuthProvider: Received DELETE on profile channel, verifying before clearing'
              )
              fetchProfile(userId, { isReload: true })
            }
          }
        )
        .subscribe()
    },
    [fetchCompany, fetchProfile]
  )

  useEffect(() => {
    mountedRef.current = true

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('AuthProvider: Missing Supabase environment variables')
      setError(
        'Supabase configuration missing. Please click the "Connect to Supabase" button in the top right corner to configure your database connection.'
      )
      setLoading(false)
      return
    }

    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.error('AuthProvider: Invalid Supabase URL format')
      setError(
        'Invalid Supabase URL. Please use the "Connect to Supabase" button to reconfigure your connection.'
      )
      setLoading(false)
      return
    }

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mountedRef.current) return

        if (error) {
          console.error('AuthProvider: Session error:', error)
          if (
            error.message.includes('Invalid API key') ||
            error.message.includes('unauthorized') ||
            error.message.includes('invalid_api_key') ||
            error.message.includes('JWT')
          ) {
            setError(
              'Invalid database credentials. Please click the "Connect to Supabase" button in the top right corner to reconfigure your connection.'
            )
          } else {
            setError(
              `Database connection error. Please click the "Connect to Supabase" button to configure your connection.`
            )
          }
          setLoading(false)
          initializedRef.current = true
          return
        }

        const nextUser = session?.user ?? null
        setUser(nextUser)
        currentUserIdRef.current = nextUser?.id ?? null

        if (nextUser) {
          await fetchProfile(nextUser.id)
          setupRealtimeSubscription(nextUser.id)
        } else {
          setLoading(false)
          initializedRef.current = true
        }
      } catch (err) {
        if (!mountedRef.current) return
        console.error('AuthProvider: Initialization error:', err)
        setUser(null)
        setProfile(null)
        setCompany(null)
        currentUserIdRef.current = null
        setLoading(false)
        initializedRef.current = true
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return

      ;(async () => {
        if (event === 'TOKEN_REFRESHED') {
          return
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const nextUser = session?.user ?? null
          const previousUserId = currentUserIdRef.current
          setUser(nextUser)
          currentUserIdRef.current = nextUser?.id ?? null

          if (!nextUser) return

          const sameUser = previousUserId === nextUser.id
          const haveProfile = !!profileRef.current

          if (sameUser && haveProfile) {
            setupRealtimeSubscription(nextUser.id)
            return
          }

          await fetchProfile(nextUser.id, { isReload: sameUser && haveProfile })
          setupRealtimeSubscription(nextUser.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setCompany(null)
          currentUserIdRef.current = null
          setLoading(false)

          if (profileChannelRef.current) {
            supabase.removeChannel(profileChannelRef.current)
            profileChannelRef.current = null
          }
          subscribedUserIdRef.current = null
        }
      })()
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      const userId = currentUserIdRef.current
      if (!userId) return
      if (!onlineRef.current) return
      fetchProfile(userId, { isReload: true })
    }

    const handleOnline = () => {
      onlineRef.current = true
      const userId = currentUserIdRef.current
      if (userId) {
        fetchProfile(userId, { isReload: true })
      }
    }

    const handleOffline = () => {
      onlineRef.current = false
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current)
        profileChannelRef.current = null
      }
      subscribedUserIdRef.current = null
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [fetchProfile, setupRealtimeSubscription])

  const signOut = async () => {
    try {
      setUser(null)
      setProfile(null)
      setCompany(null)
      currentUserIdRef.current = null
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('AuthProvider: Sign out error:', error)
      }
    } catch (err) {
      console.error('AuthProvider: Error signing out:', err)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false

    const role = profile.role as RoleType

    switch (permission) {
      case 'manage_company':
        return role === 'admin'
      case 'manage_team':
        return role === 'admin'
      case 'manage_customers':
        return role === 'admin' || role === 'customer_responsible'
      case 'manage_locations':
        return role === 'admin' || role === 'customer_responsible' || role === 'location_responsible'
      case 'view_all_locations':
        return role === 'admin' || role === 'customer_responsible' || role === 'location_responsible'
      default:
        return false
    }
  }

  const isAdmin = profile?.role === 'admin'
  const canManageCustomers = hasPermission('manage_customers')
  const canManageLocations = hasPermission('manage_locations')
  const canViewAllLocations = hasPermission('view_all_locations')

  const needsOnboarding = (() => {
    if (!profile || !user || loading) return false
    if (user.email_confirmed_at === null) return false
    if (profile.company_id) return false
    if (profile.onboarding_completed) return false
    return true
  })()

  const value = {
    user,
    profile,
    company,
    loading,
    reloadingProfile,
    error,
    signOut,
    hasPermission,
    isAdmin,
    canManageCustomers,
    canManageLocations,
    canViewAllLocations,
    needsOnboarding,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
