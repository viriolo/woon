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
    avatar_url: string | null;
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
  authorAvatarUrl: row.user_profiles?.avatar_url ?? undefined,
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
        user_profiles(name, handle, avatar_url)
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

    const cleanedMentions = (mentions ?? []).map(handle => handle.toLowerCase());

    const { data, error } = await supabase
      .from('celebration_comments')
      .insert({
        celebration_id: celebrationId,
        user_id: user.id,
        text,
        mentions: cleanedMentions,
      })
      .select(`
        id,
        celebration_id,
        user_id,
        text,
        mentions,
        created_at,
        user_profiles(name, handle, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Failed to add comment', error);
      throw new Error('Unable to post comment right now.');
    }

    return transformComment(data as SupabaseCommentRow);
  },
};
