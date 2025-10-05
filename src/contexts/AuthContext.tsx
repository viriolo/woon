import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

import { authService, type AuthUser } from '../services/authService'

import { supabase } from '../lib/supabase'

interface AuthContextType {

  user: AuthUser | null

  loading: boolean

  signUp: (name: string, email: string, password: string) => Promise<AuthUser>

  logIn: (email: string, password: string) => Promise<AuthUser>

  logOut: () => Promise<void>

  socialLogIn: () => Promise<void>

  updateProfile: (updates: any) => Promise<AuthUser>

  updateAvatar: (base64Image: string) => Promise<AuthUser>

  updateNotificationPreferences: (prefs: any) => Promise<AuthUser>

  toggleLikeStatus: (celebrationId: string) => Promise<AuthUser>

  toggleSaveStatus: (celebrationId: string) => Promise<AuthUser>

  toggleFollowStatus: (targetUserId: string) => Promise<AuthUser>

  toggleRsvpStatus: (eventId: string) => Promise<AuthUser>

  recordCelebrationContribution: () => Promise<AuthUser>

  recordEventContribution: () => Promise<AuthUser>

}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {

  const context = useContext(AuthContext)

  if (context === undefined) {

    throw new Error('useAuth must be used within an AuthProvider')

  }

  return context

}

interface AuthProviderProps {

  children: ReactNode

}

export function AuthProvider({ children }: AuthProviderProps) {

  const [user, setUser] = useState<AuthUser | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {

    let isMounted = true

    const cleanOAuthParams = () => {

      if (typeof window === 'undefined') {

        return

      }

      const url = new URL(window.location.href)

      const paramsToStrip = ['code', 'state', 'access_token', 'refresh_token', 'expires_in', 'token_type', 'error']

      let modified = false

      paramsToStrip.forEach(param => {

        if (url.searchParams.has(param)) {

          url.searchParams.delete(param)

          modified = true

        }

      })

      if (url.hash && (url.hash.includes('access_token') || url.hash.includes('error'))) {

        url.hash = ''

        modified = true

      }

      const normalizedPath = url.pathname === '/auth/callback' ? '/' : url.pathname

      if (normalizedPath !== url.pathname) {

        modified = true

      }

      if (modified) {

        const search = url.searchParams.toString()

        const cleanUrl = `${url.origin}${normalizedPath}${search ? `?${search}` : ''}`

        window.history.replaceState({}, document.title, cleanUrl)

      }

    }

    const loadInitialUser = async () => {

      try {

        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) {

          return

        }

        if (session) {

          const currentUser = await authService.getCurrentUser()

          if (isMounted && currentUser) {

            setUser(currentUser)

          }

        } else if (typeof window !== 'undefined') {

          const url = new URL(window.location.href)

          const code = url.searchParams.get('code')

          if (code) {

            try {

              const exchangedUser = await authService.exchangeCodeForSession(code)

              if (isMounted && exchangedUser) {

                setUser(exchangedUser)

              }

            } catch (error) {

              console.error('Failed to complete OAuth code exchange:', error)

            }

          }

        }

      } catch (error) {

        console.error('Error loading initial session:', error)

      } finally {

        if (isMounted) {

          setLoading(false)

          cleanOAuthParams()

        }

      }

    }

    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {

      if (!isMounted) return

      setUser(authUser)

      setLoading(false)

      cleanOAuthParams()

    })

    void loadInitialUser()

    return () => {

      isMounted = false

      subscription.unsubscribe()

    }

  }, [])

  const signUp = async (name: string, email: string, password: string): Promise<AuthUser> => {

    const user = await authService.signUp(name, email, password)

    setUser(user)

    return user

  }

  const logIn = async (email: string, password: string): Promise<AuthUser> => {

    const user = await authService.logIn(email, password)

    setUser(user)

    return user

  }

  const logOut = async (): Promise<void> => {

    await authService.logOut()

    setUser(null)

  }

  const socialLogIn = async (): Promise<void> => {
    await authService.socialLogIn()
    // User will be updated via onAuthStateChange
  }

  const updateProfile = async (updates: any): Promise<AuthUser> => {

    const updatedUser = await authService.updateProfile(updates)

    setUser(updatedUser)

    return updatedUser

  }

  const updateAvatar = async (base64Image: string): Promise<AuthUser> => {

    const updatedUser = await authService.updateAvatar(base64Image)

    setUser(updatedUser)

    return updatedUser

  }

  const updateNotificationPreferences = async (prefs: any): Promise<AuthUser> => {

    const updatedUser = await authService.updateNotificationPreferences(prefs)

    setUser(updatedUser)

    return updatedUser

  }

  const toggleLikeStatus = async (celebrationId: string): Promise<AuthUser> => {

    const updatedUser = await authService.toggleLikeStatus(celebrationId)

    setUser(updatedUser)

    return updatedUser

  }

  const toggleSaveStatus = async (celebrationId: string): Promise<AuthUser> => {

    const updatedUser = await authService.toggleSaveStatus(celebrationId)

    setUser(updatedUser)

    return updatedUser

  }

  const toggleFollowStatus = async (targetUserId: string): Promise<AuthUser> => {

    const updatedUser = await authService.toggleFollowStatus(targetUserId)

    setUser(updatedUser)

    return updatedUser

  }

  const toggleRsvpStatus = async (eventId: string): Promise<AuthUser> => {

    const updatedUser = await authService.toggleRsvpStatus(eventId)

    setUser(updatedUser)

    return updatedUser

  }

  const recordCelebrationContribution = async (): Promise<AuthUser> => {

    const updatedUser = await authService.recordCelebrationContribution()

    setUser(updatedUser)

    return updatedUser

  }

  const recordEventContribution = async (): Promise<AuthUser> => {

    const updatedUser = await authService.recordEventContribution()

    setUser(updatedUser)

    return updatedUser

  }

  const value: AuthContextType = {

    user,

    loading,

    signUp,

    logIn,

    logOut,

    socialLogIn,

    updateProfile,

    updateAvatar,

    updateNotificationPreferences,

    toggleLikeStatus,

    toggleSaveStatus,

    toggleFollowStatus,

    toggleRsvpStatus,

    recordCelebrationContribution,

    recordEventContribution

  }

  return (

    <AuthContext.Provider value={value}>

      {children}

    </AuthContext.Provider>

  )

}

