import React, { useState, useEffect } from 'react';
import type { Celebration, User, Comment } from '../types';
import { commentService } from '../services/commentService';
import { celebrationService } from '../services/celebrationService';
import { HeartIcon, ArrowLeftIcon, LoadingSpinner } from './icons';

interface CelebrationDetailViewProps {
    celebration: Celebration;
    currentUser: User | null;
    onBack: () => void;
    onToggleLike: (celebrationId: number) => void;
    onCommentAdded: (celebrationId: number) => void;
}

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
    const avatarUrl = `https://i.pravatar.cc/150?u=${comment.authorId}`;
    return (
        <div className="flex items-start gap-3">
            <img src={avatarUrl} alt={comment.authorName} className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0" />
            <div className="flex-grow bg-neutral-200/60 rounded-lg px-3 py-2">
                <p className="font-bold text-sm text-neutral-800">{comment.authorName}</p>
                <p className="text-sm text-neutral-700">{comment.text}</p>
            </div>
        </div>
    );
};

export const CelebrationDetailView: React.FC<CelebrationDetailViewProps> = ({ celebration, currentUser, onBack, onToggleLike, onCommentAdded }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isPostingComment, setIsPostingComment] = useState(false);
    
    const isLiked = !!currentUser?.likedCelebrationIds.includes(celebration.id);

    useEffect(() => {
        const fetchComments = async () => {
            setIsLoadingComments(true);
            try {
                const fetchedComments = await commentService.getCommentsForCelebration(celebration.id);
                setComments(fetchedComments);
            } catch (error) {
                console.error("Failed to fetch comments:", error);
            } finally {
                setIsLoadingComments(false);
            }
        };
        fetchComments();
    }, [celebration.id]);

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        setIsPostingComment(true);
        try {
            const addedComment = await commentService.addComment(celebration.id, newComment.trim(), currentUser);
            await celebrationService.incrementCommentCount(celebration.id);
            setComments(prev => [...prev, addedComment]);
            onCommentAdded(celebration.id);
            setNewComment('');
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setIsPostingComment(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <header className="flex items-center gap-4 flex-shrink-0 mb-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-neutral-200 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-neutral-600" />
                </button>
                <h2 className="text-xl font-bold truncate">{celebration.title}</h2>
            </header>

            <div className="flex-grow overflow-y-auto space-y-4">
                <img src={celebration.imageUrl} alt={celebration.title} className="w-full h-48 object-cover rounded-lg" />
                
                <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600">by <span className="font-bold">{celebration.author}</span></p>
                    <button 
                        onClick={() => onToggleLike(celebration.id)}
                        className="flex items-center gap-2 p-2 rounded-full transition-colors group"
                    >
                        <HeartIcon className={`w-6 h-6 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-neutral-400 group-hover:text-red-400'}`} />
                        <span className="text-sm font-medium text-neutral-600">{celebration.likes}</span>
                    </button>
                </div>

                <p className="text-neutral-700">{celebration.description}</p>
                
                <div className="border-t border-neutral-200 pt-4 space-y-4">
                    <h3 className="font-bold text-neutral-800">Comments ({celebration.commentCount})</h3>
                    {isLoadingComments ? (
                        <div className="flex justify-center py-4"><LoadingSpinner className="w-6 h-6 text-special-primary" /></div>
                    ) : (
                        comments.length > 0 ? (
                           comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                        ) : (
                            <p className="text-sm text-neutral-500 text-center py-4">Be the first to comment!</p>
                        )
                    )}
                </div>
            </div>

            {currentUser && (
                <form onSubmit={handlePostComment} className="flex-shrink-0 mt-4 flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        disabled={isPostingComment}
                        className="w-full p-3 bg-white border border-neutral-300 rounded-full placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    <button type="submit" disabled={isPostingComment || !newComment.trim()} className="px-4 py-2 bg-special-primary text-white font-bold rounded-full hover:opacity-90 transition disabled:opacity-50">
                        {isPostingComment ? <LoadingSpinner className="w-5 h-5"/> : 'Post'}
                    </button>
                </form>
            )}
        </div>
    );
};
