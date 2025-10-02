import { supabase } from './supabaseClient';
import type { Event, EventAttendee } from '../types';
import { USER_LOCATION } from '../constants';

interface SupabaseEventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  location_coords: { lat?: number; lng?: number } | null;
  max_attendees: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  host?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
  event_rsvps?: Array<{
    user_id: string;
    rsvp_status: string | null;
    attendee?: {
      id: string;
      name: string | null;
      avatar_url: string | null;
    } | null;
  }>;
}

const TIME_FALLBACK = '00:00';

const normalizeTime = (time: string | null): string => {
  if (!time) return TIME_FALLBACK;
  // Supabase returns HH:MM:SS for time columns
  return time.length > 5 ? time.slice(0, 5) : time;
};

const randomizeFallbackCoords = () => {
  const variance = 0.12;
  return {
    lng: USER_LOCATION.lng + (Math.random() - 0.5) * variance,
    lat: USER_LOCATION.lat + (Math.random() - 0.5) * variance,
  };
};

const transformEventRow = (row: SupabaseEventRow): Event => {
  const coords = row.location_coords;
  const fallback = randomizeFallbackCoords();
  const attendees: EventAttendee[] = (row.event_rsvps ?? []).map((rsvp) => ({
    userId: rsvp.user_id,
    userName: rsvp.attendee?.name ?? 'Neighbor',
    avatarUrl: rsvp.attendee?.avatar_url ?? undefined,
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    date: row.event_date ?? new Date().toISOString().slice(0, 10),
    time: normalizeTime(row.event_time),
    location: row.location ?? 'Community space',
    authorId: row.created_by,
    authorName: row.host?.name ?? 'Community Host',
    attendeeCount: attendees.length,
    attendees,
    locationCoords: {
      lng: typeof coords?.lng === 'number' ? coords.lng : fallback.lng,
      lat: typeof coords?.lat === 'number' ? coords.lat : fallback.lat,
    },
  };
};

const eventSelect = `
  id,
  title,
  description,
  event_date,
  event_time,
  location,
  location_coords,
  max_attendees,
  created_by,
  created_at,
  updated_at,
  host:user_profiles!events_created_by_fkey(id, name, avatar_url),
  event_rsvps(
    user_id,
    rsvp_status,
    attendee:user_profiles!event_rsvps_user_id_fkey(id, name, avatar_url)
  )
`;

export const supabaseEventService = {
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select(eventSelect)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true, nullsFirst: true });

    if (error) {
      console.error('Failed to load events from Supabase', error);
      throw new Error('Unable to load events.');
    }

    if (!data) {
      return [];
    }

    return data.map(transformEventRow);
  },

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select(eventSelect)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load event', error);
      throw new Error('Unable to load event.');
    }

    return data ? transformEventRow(data) : null;
  },

  async createEvent(
    eventData: {
      title: string;
      description: string;
      date: string;
      time: string;
      location: string;
    },
    userId: string,
    authorName: string
  ): Promise<Event> {
    const locationCoords = randomizeFallbackCoords();

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.date,
        event_time: eventData.time,
        location: eventData.location,
        location_coords: locationCoords,
        created_by: userId,
      })
      .select(eventSelect)
      .single();

    if (error) {
      console.error('Failed to create event', error);
      throw new Error('Unable to create event right now.');
    }

    // Ensure host information is present even if the join did not return it yet.
    if (data && !data.host) {
      data.host = { id: userId, name: authorName, avatar_url: null };
    }

    return transformEventRow(data as SupabaseEventRow);
  },

  async toggleRsvp(eventId: string, userId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('event_rsvps')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing RSVP:', error);
        throw new Error('Failed to remove RSVP');
      }
      return false;
    } else {
      const { error } = await supabase
        .from('event_rsvps')
        .insert({
          event_id: eventId,
          user_id: userId,
          rsvp_status: 'attending',
        });

      if (error) {
        console.error('Error adding RSVP:', error);
        throw new Error('Failed to add RSVP');
      }
      return true;
    }
  },

  subscribeToEvents(callback: (event: Event) => void) {
    return supabase
      .channel('events-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        async (payload) => {
          const event = await supabaseEventService.getEventById(String(payload.new.id));
          if (event) {
            callback(event);
          }
        }
      )
      .subscribe();
  },
};
