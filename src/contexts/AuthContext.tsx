import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, type AuthUser } from '../services/authService'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (name: string, email: string, password: string) => Promise<AuthUser>
  logIn: (email: string, password: string) => Promise<AuthUser>
  logOut: () => Promise<void>
  socialLogIn: (provider: 'google' | 'github') => Promise<void>
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
    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user)
      setLoading(false)
    })

    // Initial user load
    authService.getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    return () => subscription.unsubscribe()
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

  const socialLogIn = async (provider: 'google' | 'github'): Promise<void> => {
    await authService.socialLogIn(provider)
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