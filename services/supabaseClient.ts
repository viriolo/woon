import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          handle: string | null;
          avatar_url: string | null;
          streak_days: number;
          experience_points: number;
          level: number;
          notification_preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          name: string;
          handle?: string;
          avatar_url?: string;
        };
        Update: {
          name?: string;
          handle?: string;
          avatar_url?: string;
          streak_days?: number;
          experience_points?: number;
          level?: number;
          notification_preferences?: any;
        };
      };
      celebrations: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          location: string | null; // PostGIS POINT as string
          location_name: string | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string;
          image_url?: string;
          location?: string;
          location_name?: string;
        };
        Update: {
          title?: string;
          description?: string;
          image_url?: string;
          location?: string;
          location_name?: string;
          likes_count?: number;
          comments_count?: number;
        };
      };
      // Add other table types...
    };
  };
}