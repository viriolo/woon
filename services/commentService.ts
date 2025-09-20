import type { Comment, User } from '../types';

const COMMENTS_STORAGE_KEY = 'woon_comments';

// This is a simulation of a comments database using localStorage.
// For a real app, this would be a secure backend service.

// Add some mock comments for demonstration
const initialMockComments: Comment[] = [
    { id: 'comment-1-1', celebrationId: 1, authorId: 'mock-2', authorName: 'David L.', text: 'Looks so peaceful! I love watercolor.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), mentionedUserIds: [] },
    { id: 'comment-1-2', celebrationId: 1, authorId: 'mock-3', authorName: 'Chloe T.', text: 'Beautiful setup!', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), mentionedUserIds: [] },
    { id: 'comment-2-1', celebrationId: 2, authorId: 'mock-1', authorName: 'Maria S.', text: 'Wow, that must have taken forever!', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), mentionedUserIds: [] },
];

const getStoredComments = (): Comment[] => {
    try {
        const storedComments = localStorage.getItem(COMMENTS_STORAGE_KEY);
        if (storedComments) {
            return JSON.parse(storedComments);
        }
        // If no comments are stored, initialize with mock data
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(initialMockComments));
        return initialMockComments;
    } catch (error) {
        console.error('Failed to parse comments from localStorage', error);
        return [];
    }
};

const saveStoredComments = (comments: Comment[]) => {
    try {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
    } catch (error) {
        console.error('Failed to save comments to localStorage', error);
    }
};

export const commentService = {
    getCommentsForCelebration: async (celebrationId: number): Promise<Comment[]> => {
        // Simulate async API call
        await new Promise(resolve => setTimeout(resolve, 300));
        const allComments = getStoredComments();
        return allComments
            .filter(c => c.celebrationId === celebrationId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    addComment: async (
        celebrationId: number,
        text: string,
        user: User,
        mentionedUserIds: string[] = []
    ): Promise<Comment> => {
        if (!user) {
            throw new Error('Authentication required to add a comment.');
        }

        const newComment: Comment = {
            id: new Date().toISOString() + Math.random(),
            celebrationId,
            text,
            authorId: user.id,
            authorName: user.name,
            timestamp: new Date().toISOString(),
            mentionedUserIds,
        };

        // Simulate async API call
        await new Promise(resolve => setTimeout(resolve, 600));

        const comments = getStoredComments();
        comments.push(newComment);
        saveStoredComments(comments);

        return newComment;
    },
};
