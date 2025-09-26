import { supabase } from './supabaseClient';
import type { Celebration, UserLocation } from '../types';

export const supabaseCelebrationService = {
  // Get celebrations with location filtering
  getCelebrations: async (userLocation?: UserLocation, radiusKm: number = 50): Promise<Celebration[]> => {
    let query = supabase
      .from('celebrations')
      .select(`
        *,
        users!inner(name, handle, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Add location filtering if provided
    if (userLocation) {
      // PostGIS query for nearby celebrations
      query = query.rpc('celebrations_near_location', {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius_km: radiusKm
      });
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(transformDatabaseCelebration);
  },

  // Create celebration
  createCelebration: async (celebration: {
    title: string;
    description: string;
    imageUrl?: string;
    location: UserLocation;
    locationName?: string;
  }): Promise<Celebration> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('celebrations')
      .insert({
        user_id: user.id,
        title: celebration.title,
        description: celebration.description,
        image_url: celebration.imageUrl,
        location: `POINT(${celebration.location.lng} ${celebration.location.lat})`,
        location_name: celebration.locationName
      })
      .select(`
        *,
        users!inner(name, handle, avatar_url)
      `)
      .single();

    if (error) throw error;
    return transformDatabaseCelebration(data);
  },

  // Like/unlike celebration
  toggleLike: async (celebrationId: number): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('celebration_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('celebration_id', celebrationId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('celebration_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('celebration_id', celebrationId);

      // Decrement count
      await supabase.rpc('decrement_celebration_likes', {
        celebration_id: celebrationId
      });

      return false;
    } else {
      // Like
      await supabase
        .from('celebration_likes')
        .insert({
          user_id: user.id,
          celebration_id: celebrationId
        });

      // Increment count
      await supabase.rpc('increment_celebration_likes', {
        celebration_id: celebrationId
      });

      return true;
    }
  },

  // Save/unsave celebration
  toggleSave: async (celebrationId: number): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingSave } = await supabase
      .from('celebration_saves')
      .select('*')
      .eq('user_id', user.id)
      .eq('celebration_id', celebrationId)
      .single();

    if (existingSave) {
      await supabase
        .from('celebration_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('celebration_id', celebrationId);
      return false;
    } else {
      await supabase
        .from('celebration_saves')
        .insert({
          user_id: user.id,
          celebration_id: celebrationId
        });
      return true;
    }
  },

  // Real-time subscription for new celebrations
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
          // Fetch full celebration data with user info
          const { data } = await supabase
            .from('celebrations')
            .select(`
              *,
              users!inner(name, handle, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(transformDatabaseCelebration(data));
          }
        }
      )
      .subscribe();
  }
};

// Database functions (SQL)
const createDatabaseFunctions = `
-- Function to find celebrations near a location
CREATE OR REPLACE FUNCTION celebrations_near_location(lat FLOAT, lng FLOAT, radius_km FLOAT)
RETURNS TABLE(
  id BIGINT,
  user_id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  location POINT,
  location_name TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMPTZ,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.title,
    c.description,
    c.image_url,
    c.location,
    c.location_name,
    c.likes_count,
    c.comments_count,
    c.created_at,
    ST_Distance(
      ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
      ST_GeogFromText('POINT(' || ST_X(c.location) || ' ' || ST_Y(c.location) || ')')
    ) / 1000 as distance_km
  FROM celebrations c
  WHERE ST_DWithin(
    ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
    ST_GeogFromText('POINT(' || ST_X(c.location) || ' ' || ST_Y(c.location) || ')'),
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to increment likes
CREATE OR REPLACE FUNCTION increment_celebration_likes(celebration_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE celebrations
  SET likes_count = likes_count + 1
  WHERE id = celebration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement likes
CREATE OR REPLACE FUNCTION decrement_celebration_likes(celebration_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE celebrations
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = celebration_id;
END;
$$ LANGUAGE plpgsql;
`;

const transformDatabaseCelebration = (dbCelebration: any): Celebration => {
  // Parse PostGIS POINT format
  const locationMatch = dbCelebration.location?.match(/POINT\(([^)]+)\)/);
  const [lng, lat] = locationMatch ? locationMatch[1].split(' ').map(Number) : [0, 0];

  return {
    id: dbCelebration.id,
    authorId: dbCelebration.user_id,
    author: dbCelebration.users.name,
    title: dbCelebration.title,
    description: dbCelebration.description || '',
    imageUrl: dbCelebration.image_url || '',
    likes: dbCelebration.likes_count,
    commentCount: dbCelebration.comments_count,
    position: { lng, lat }
  };
};