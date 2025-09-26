import { supabase } from './supabaseClient';
import type { User } from '../types';

export const supabaseAuthService = {
  // Sign up with email
  signUp: async (email: string, password: string, name: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;
    if (!data.user) return null;

    // Create profile in users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        name,
        handle: generateHandle(name)
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return transformDatabaseUser(profile);
  },

  // Sign in
  signIn: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.user) return null;

    return await getCurrentUser();
  },

  // Social login
  signInWithProvider: async (provider: 'google' | 'github'): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select(`
        *,
        user_follows!follower_id(followed_id),
        celebration_likes(celebration_id),
        celebration_saves(celebration_id),
        event_rsvps(event_id),
        user_achievements(achievement_id)
      `)
      .eq('id', user.id)
      .single();

    if (!profile) return null;
    return transformDatabaseUser(profile);
  },

  // Update profile
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        handle: updates.handle,
        avatar_url: updates.avatarUrl,
        notification_preferences: updates.notificationPreferences
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseUser(data);
  },

  // Auth state listener
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};

// Helper functions
const generateHandle = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).slice(-4);
};

const getCurrentUser = async (): Promise<User | null> => {
  return await supabaseAuthService.getCurrentUser();
};

const transformDatabaseUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    handle: dbUser.handle,
    avatarUrl: dbUser.avatar_url,
    notificationPreferences: dbUser.notification_preferences || {
      dailySpecialDay: true,
      communityActivity: true
    },
    streakDays: dbUser.streak_days || 1,
    experiencePoints: dbUser.experience_points || 0,
    level: dbUser.level || 1,
    likedCelebrationIds: dbUser.celebration_likes?.map((like: any) => like.celebration_id) || [],
    savedCelebrationIds: dbUser.celebration_saves?.map((save: any) => save.celebration_id) || [],
    rsvpedEventIds: dbUser.event_rsvps?.map((rsvp: any) => rsvp.event_id) || [],
    followingUserIds: dbUser.user_follows?.map((follow: any) => follow.followed_id) || [],
    achievements: dbUser.user_achievements?.map((ua: any) => ({
      id: ua.achievement_id,
      name: '',  // You'll need to join with achievements table
      description: '',
      earnedAt: ua.earned_at
    })) || []
  };
};