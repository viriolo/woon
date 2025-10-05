import { supabase } from './supabaseClient';
import type { Celebration } from '../types';

export interface SupabaseCelebration {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location_lng: number | null;
  location_lat: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profiles: {
    name: string;
    handle: string | null;
    avatar_url: string | null;
  } | null;
}

const transformCelebration = (dbCelebration: SupabaseCelebration): Celebration => {
  return {
    id: dbCelebration.id,
    authorId: dbCelebration.user_id,
    author: dbCelebration.user_profiles?.name || 'Anonymous',
    title: dbCelebration.title,
    description: dbCelebration.description || '',
    imageUrl: dbCelebration.image_url || '',
    likes: dbCelebration.likes_count,
    commentCount: dbCelebration.comments_count,
    position: {
      lng: dbCelebration.location_lng || 0,
      lat: dbCelebration.location_lat || 0,
    },
  };
};

export const supabaseCelebrationService = {
  getCelebrations: async (): Promise<Celebration[]> => {
    const { data, error } = await supabase
      .from('celebrations')
      .select(`
        *,
        user_profiles!inner(name, handle, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching celebrations:', error);
      throw new Error('Failed to fetch celebrations');
    }

    return (data || []).map(transformCelebration);
  },

  getCelebrationById: async (id: number): Promise<Celebration | null> => {
    const { data, error } = await supabase
      .from('celebrations')
      .select(`
        *,
        user_profiles!inner(name, handle, avatar_url)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching celebration:', error);
      throw new Error('Failed to fetch celebration');
    }

    return data ? transformCelebration(data) : null;
  },

  getCelebrationsByUserId: async (userId: string): Promise<Celebration[]> => {
    const { data, error } = await supabase
      .from('celebrations')
      .select(`
        *,
        user_profiles!inner(name, handle, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false});

    if (error) {
      console.error('Error fetching user celebrations:', error);
      throw new Error('Failed to fetch user celebrations');
    }

    return (data || []).map(transformCelebration);
  },

  createCelebration: async (
    celebrationData: Pick<Celebration, 'title' | 'description' | 'imageUrl'>,
    user: { id: string },
    position?: { lng: number; lat: number }
  ): Promise<Celebration> => {
    const { data, error } = await supabase
      .from('celebrations')
      .insert({
        user_id: user.id,
        title: celebrationData.title,
        description: celebrationData.description,
        image_url: celebrationData.imageUrl,
        location_lng: position?.lng,
        location_lat: position?.lat,
      })
      .select(`
        *,
        user_profiles!inner(name, handle, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating celebration:', error);
      throw new Error('Failed to create celebration');
    }

    return transformCelebration(data);
  },

  updateCelebration: async (
    id: number,
    updates: Partial<Pick<Celebration, 'title' | 'description' | 'imageUrl'>>
  ): Promise<Celebration> => {
    const { data, error } = await supabase
      .from('celebrations')
      .update({
        title: updates.title,
        description: updates.description,
        image_url: updates.imageUrl,
      })
      .eq('id', id)
      .select(`
        *,
        user_profiles!inner(name, handle, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error updating celebration:', error);
      throw new Error('Failed to update celebration');
    }

    return transformCelebration(data);
  },

  deleteCelebration: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('celebrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting celebration:', error);
      throw new Error('Failed to delete celebration');
    }
  },

  toggleLike: async (celebrationId: number, userId: string): Promise<boolean> => {
    const { data: existing } = await supabase
      .from('celebration_likes')
      .select('user_id')
      .eq('celebration_id', celebrationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('celebration_likes')
        .delete()
        .eq('celebration_id', celebrationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing like:', error);
        throw new Error('Failed to remove like');
      }
      return false;
    } else {
      const { error } = await supabase
        .from('celebration_likes')
        .insert({
          celebration_id: celebrationId,
          user_id: userId,
        });

      if (error) {
        console.error('Error adding like:', error);
        throw new Error('Failed to add like');
      }
      return true;
    }
  },

  toggleSave: async (celebrationId: number, userId: string): Promise<boolean> => {
    const { data: existing } = await supabase
      .from('celebration_saves')
      .select('user_id')
      .eq('celebration_id', celebrationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('celebration_saves')
        .delete()
        .eq('celebration_id', celebrationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing save:', error);
        throw new Error('Failed to remove save');
      }
      return false;
    } else {
      const { error } = await supabase
        .from('celebration_saves')
        .insert({
          celebration_id: celebrationId,
          user_id: userId,
        });

      if (error) {
        console.error('Error saving celebration:', error);
        throw new Error('Failed to save celebration');
      }
      return true;
    }
  },

  subscribeToNewCelebrations: (callback: (celebration: Celebration) => void) => {
    return supabase
      .channel('celebrations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'celebrations'
        },
        async (payload) => {
          const { data } = await supabase
            .from('celebrations')
            .select(`
              *,
              user_profiles!inner(name, handle, avatar_url)
            `)
            .eq('id', payload.new.id)
            .maybeSingle();

          if (data) {
            callback(transformCelebration(data));
          }
        }
      )
      .subscribe();
  }
};