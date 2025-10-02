import type { Comment, User } from "../types";
import { supabaseCommentService } from "./supabaseCommentService";

const fallbackComments: Comment[] = [
    { id: "comment-1-1", celebrationId: 1, authorId: "mock-2", authorName: "David L.", text: "Looks so peaceful! I love watercolor.", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), mentions: [] },
    { id: "comment-1-2", celebrationId: 1, authorId: "mock-3", authorName: "Chloe T.", text: "Beautiful setup!", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), mentions: [] },
    { id: "comment-2-1", celebrationId: 2, authorId: "mock-1", authorName: "Maria S.", text: "Wow, that must have taken forever!", timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), mentions: [] },
];

const extractMentions = (text: string): string[] => {
    const matches = text.match(/@([a-z0-9_]+)/gi);
    if (!matches) return [];
    return Array.from(new Set(matches.map(match => match.slice(1).toLowerCase())));
};

export const commentService = {
    async getCommentsForCelebration(celebrationId: number): Promise<Comment[]> {
        try {
            const comments = await supabaseCommentService.getCommentsForCelebration(celebrationId);
            if (comments.length === 0) {
                return fallbackComments.filter(comment => comment.celebrationId === celebrationId);
            }
            return comments;
        } catch (error) {
            console.error("Failed to fetch comments from Supabase", error);
            return fallbackComments.filter(comment => comment.celebrationId === celebrationId);
        }
    },

    async addComment(
        celebrationId: number,
        text: string,
        user: User
    ): Promise<Comment> {
        if (!user) {
            throw new Error("Authentication required to add a comment.");
        }

        const mentions = extractMentions(text);

        try {
            return await supabaseCommentService.addComment(celebrationId, text, mentions, user);
        } catch (error) {
            console.error("Supabase comment creation failed", error);
            // Fall back to an optimistic comment so the UI remains responsive.
            return {
                id: `${Date.now()}`,
                celebrationId,
                authorId: user.id,
                authorName: user.name,
                text,
                mentions,
                timestamp: new Date().toISOString(),
            };
        }
    },
};
