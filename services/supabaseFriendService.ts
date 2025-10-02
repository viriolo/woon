import { supabase } from './supabaseClient';
import { USER_LOCATION, FRIEND_CONNECTIONS } from '../constants';
import type { FriendConnection } from '../types';

const randomizeCoords = () => {
  const variance = 0.1;
  return {
    lng: USER_LOCATION.lng + (Math.random() - 0.5) * variance,
    lat: USER_LOCATION.lat + (Math.random() - 0.5) * variance,
  };
};

const buildConnectionMessage = (name: string, location?: string | null) => {
  if (location) {
    return `${name.split(' ')[0]} is sparking joy in ${location}.`;
  }
  return `${name.split(' ')[0]} is planning a neighborhood celebration.`;
};

export const supabaseFriendService = {
  async getConnectionsForUser(userId: string | null): Promise<FriendConnection[]> {
    try {
      let profilesQuery = supabase
        .from('user_profiles')
        .select('id, name, avatar_url, location')
        .limit(40);

      if (userId) {
        profilesQuery = profilesQuery.neq('id', userId);
      }

      const profilesPromise = profilesQuery;
      const followsPromise = userId
        ? supabase.from('user_follows').select('followed_id').eq('follower_id', userId)
        : Promise.resolve({ data: [], error: null });

      const [{ data: profiles, error: profileError }, followingResult] = await Promise.all([
        profilesPromise,
        followsPromise,
      ]);

      if (followingResult && 'error' in followingResult && followingResult.error) {
        throw followingResult.error;
      }

      if (profileError) {
        throw profileError;
      }

      const followingIds = new Set(
        (followingResult.data ?? []).map((row: { followed_id: string }) => row.followed_id)
      );

      if (!profiles || profiles.length === 0) {
        return FRIEND_CONNECTIONS;
      }

      return profiles.map((profile) => {
        const coords = randomizeCoords();
        const name = profile.name ?? 'Neighbor';

        return ({
          id: profile.id,
          name,
          avatarUrl: profile.avatar_url ?? `https://i.pravatar.cc/150?u=${profile.id}`,
          location: coords,
          celebrationMessage: buildConnectionMessage(name, profile.location),
          isNearby: followingIds.has(profile.id) || Boolean(profile.location),
        }) as FriendConnection;
      });
    } catch (error) {
      console.error('Failed to load friend connections from Supabase', error);
      return FRIEND_CONNECTIONS;
    }
  },
};
