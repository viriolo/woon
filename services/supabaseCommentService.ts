import { supabase } from './supabaseClient';
import type { Comment, User } from '../types';

interface SupabaseCommentRow {
  id: string;
  celebration_id: number;
  user_id: string;
  text: string;
  mentions: string[] | null;
  created_at: string;
  user_profiles?: {
    name: string | null;
    handle: string | null;
  } | null;
}

const transformComment = (row: SupabaseCommentRow): Comment => ({
  id: row.id,
  celebrationId: Number(row.celebration_id),
  authorId: row.user_id,
  authorName: row.user_profiles?.name ?? 'Neighbor',
  text: row.text,
  mentions: row.mentions ?? [],
  timestamp: row.created_at,
});

export const supabaseCommentService = {
  async getCommentsForCelebration(celebrationId: number): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('celebration_comments')
      .select(`
        id,
        celebration_id,
        user_id,
        text,
        mentions,
        created_at,
        user_profiles(name, handle)
      `)
      .eq('celebration_id', celebrationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load comments', error);
      throw new Error('Unable to load comments right now.');
    }

    return (data ?? []).map(transformComment);
  },

  async addComment(celebrationId: number, text: string, mentions: string[], user: User): Promise<Comment> {
    if (!user) {
      throw new Error('Authentication required to add a comment.');
    }

    const { data, error } = await supabase
      .from('celebration_comments')
      .insert({
        celebration_id: celebrationId,
        user_id: user.id,
        text,
        mentions,
      })
      .select(`
        id,
        celebration_id,
        user_id,
        text,
        mentions,
        created_at,
        user_profiles(name, handle)
      `)
      .single();

    if (error) {
      console.error('Failed to add comment', error);
      throw new Error('Unable to post comment right now.');
    }

    return transformComment(data as SupabaseCommentRow);
  },
};
