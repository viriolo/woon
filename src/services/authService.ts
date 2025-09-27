import { supabase } from '../lib/supabase'
import type { User, NotificationPreferences, Achievement } from '../../types'

export interface AuthUser {
  id: string
  email: string
  name: string
  handle?: string
  avatarUrl?: string
  bio?: string
  location?: string
  streakDays: number
  experiencePoints: number
  level: number
  notificationPreferences: NotificationPreferences
  achievements: Achievement[]
  likedCelebrationIds: string[]
  savedCelebrationIds: string[]
  rsvpedEventIds: string[]
  followingUserIds: string[]
  createdAt: string
  updatedAt: string
}

// Transform database user to app user format
const transformDatabaseUser = (dbUser: any): AuthUser => {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    handle: dbUser.handle,
    avatarUrl: dbUser.avatar_url,
    bio: dbUser.bio,
    location: dbUser.location,
    streakDays: dbUser.streak_days || 1,
    experiencePoints: dbUser.experience_points || 0,
    level: dbUser.level || 1,
    notificationPreferences: dbUser.notification_preferences || {
      dailySpecialDay: true,
      communityActivity: true,
      eventReminders: true,
      followNotifications: true
    },
    achievements: dbUser.user_achievements?.map((ua: any) => ({
      id: ua.achievements.id || ua.achievement_id,
      name: ua.achievements?.name || '',
      description: ua.achievements?.description || '',
      earnedAt: ua.earned_at
    })) || [],
    likedCelebrationIds: dbUser.celebration_likes?.map((like: any) => like.celebration_id) || [],
    savedCelebrationIds: dbUser.celebration_saves?.map((save: any) => save.celebration_id) || [],
    rsvpedEventIds: dbUser.event_rsvps?.map((rsvp: any) => rsvp.event_id) || [],
    followingUserIds: dbUser.user_follows?.map((follow: any) => follow.followed_id) || [],
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  }
}

// Generate unique handle
const generateHandle = (name: string): string => {
  const baseHandle = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12)

  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${baseHandle}${randomSuffix}`
}

export const authService = {
  // Sign up with email and password
  async signUp(name: string, email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name
        }
      }
    })

    if (error) throw error
    if (!data.user) throw new Error('User creation failed')

    // The user profile is automatically created via trigger
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    return await this.getCurrentUser() as AuthUser
  },

  // Sign in with email and password
  async logIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    if (!data.user) throw new Error('Login failed')

    return await this.getCurrentUser() as AuthUser
  },

  // Social login (Google, Facebook, etc.)
  async socialLogIn(provider: 'google' | 'facebook'): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    // For OAuth, the user will be redirected and we handle the response elsewhere
  },

  // Sign out
  async logOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Check current session
  checkSession(): AuthUser | null {
    // This will be handled by the auth state listener in the app
    return null
  },

  // Get current user with full profile data
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user_achievements(
          earned_at,
          achievements(id, name, description, icon)
        ),
        celebration_likes(celebration_id),
        celebration_saves(celebration_id),
        event_rsvps(event_id),
        user_follows!follower_id(followed_id)
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    if (!profile) return null

    return transformDatabaseUser(profile)
  },

  // Update notification preferences
  async updateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('user_profiles')
      .update({
        notification_preferences: prefs
      })
      .eq('id', user.id)

    if (error) throw error

    return await this.getCurrentUser() as AuthUser
  },

  // Update avatar
  async updateAvatar(base64Image: string): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // For now, just save the base64 image directly
    // In a real app, you'd upload to storage first
    const { error } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: base64Image
      })
      .eq('id', user.id)

    if (error) throw error

    return await this.getCurrentUser() as AuthUser
  },

  // Update profile
  async updateProfile(updates: {
    name?: string
    handle?: string
    bio?: string
    location?: string
  }): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    return await this.getCurrentUser() as AuthUser
  },

  // Toggle like status for celebrations
  async toggleLikeStatus(celebrationId: string): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('celebration_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('celebration_id', celebrationId)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('celebration_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('celebration_id', celebrationId)

      if (error) throw error
    } else {
      // Like
      const { error } = await supabase
        .from('celebration_likes')
        .insert({
          user_id: user.id,
          celebration_id: celebrationId
        })

      if (error) throw error
    }

    return await this.getCurrentUser() as AuthUser
  },

  // Toggle save status for celebrations
  async toggleSaveStatus(celebrationId: string): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('celebration_saves')
      .select('*')
      .eq('user_id', user.id)
      .eq('celebration_id', celebrationId)
      .single()

    if (existingSave) {
      // Unsave
      const { error } = await supabase
        .from('celebration_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('celebration_id', celebrationId)

      if (error) throw error
    } else {
      // Save
      const { error } = await supabase
        .from('celebration_saves')
        .insert({
          user_id: user.id,
          celebration_id: celebrationId
        })

      if (error) throw error
    }

    return await this.getCurrentUser() as AuthUser
  },

  // Toggle follow status
  async toggleFollowStatus(targetUserId: string): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    if (user.id === targetUserId) {
      throw new Error('Cannot follow yourself')
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('followed_id', targetUserId)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', targetUserId)

      if (error) throw error
    } else {
      // Follow
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          followed_id: targetUserId
        })

      if (error) throw error
    }

    return await this.getCurrentUser() as AuthUser
  },

  // Toggle RSVP status for events
  async toggleRsvpStatus(eventId: string): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check if already RSVP'd
    const { data: existingRsvp } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .single()

    if (existingRsvp) {
      // Remove RSVP
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId)

      if (error) throw error
    } else {
      // Add RSVP
      const { error } = await supabase
        .from('event_rsvps')
        .insert({
          user_id: user.id,
          event_id: eventId,
          rsvp_status: 'attending'
        })

      if (error) throw error
    }

    return await this.getCurrentUser() as AuthUser
  },

  // Record celebration contribution (for experience points)
  async recordCelebrationContribution(): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Experience points are awarded automatically via triggers
    // Just update streak
    const { error } = await supabase
      .from('user_profiles')
      .update({
        streak_days: supabase.sql`streak_days + 1`
      })
      .eq('id', user.id)

    if (error) throw error

    return await this.getCurrentUser() as AuthUser
  },

  // Record event contribution (for experience points)
  async recordEventContribution(): Promise<AuthUser> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Experience points are awarded automatically via triggers
    return await this.getCurrentUser() as AuthUser
  },

  // Listen for auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const user = await this.getCurrentUser()
          callback(user)
        } catch (error) {
          console.error('Error getting user after auth change:', error)
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  }
}