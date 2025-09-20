import React, { useState, useEffect, useMemo } from 'react';
import type { Celebration, User, Comment } from '../types';
import { commentService } from '../services/commentService';
import { celebrationService } from '../services/celebrationService';
import { HeartIcon, ArrowLeftIcon, LoadingSpinner, BookmarkIcon } from './icons';
import { ShareButton } from './ShareButton';
import { MentionInput } from './MentionInput';

interface CelebrationDetailViewProps {
    celebration: Celebration;
    currentUser: User | null;
    onBack: () => void;
    onToggleLike: (celebrationId: number) => void;
    onToggleSave: (celebrationId: number) => void;
    onCommentAdded: (celebrationId: number) => void;
}

interface MentionableUser {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
}

const buildHandle = (name: string, fallback: string) => {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (sanitized.length > 0) {
        return sanitized;
    }
    const condensed = name.toLowerCase().replace(/\s+/g, '');
    return condensed || fallback;
};

const createMentionableUser = (id: string | undefined, name: string | undefined, avatarUrl?: string): MentionableUser | null => {
    if (!id || !name) {
        return null;
    }
    const handle = buildHandle(name, id.toLowerCase());
    return { id, name, handle, avatarUrl };
};

const renderCommentText = (
    comment: Comment,
    mentionUsersByHandle: Map<string, MentionableUser>
) => {
    const mentionIds = new Set(comment.mentionedUserIds ?? []);
    if (mentionIds.size === 0) {
        return comment.text;
    }

    const parts: React.ReactNode[] = [];
    const regex = /@([a-z0-9_]+)/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(comment.text)) !== null) {
        const start = match.index;
        const end = regex.lastIndex;
        if (start > lastIndex) {
            parts.push(comment.text.slice(lastIndex, start));
        }

        const handle = match[1].toLowerCase();
        const mentionUser = mentionUsersByHandle.get(handle);
        const isValidMention = mentionUser && mentionIds.has(mentionUser.id);

        if (isValidMention && mentionUser) {
            parts.push(
                <span key={`${comment.id}-${start}`} className="text-special-secondary font-medium">
                    @{mentionUser.name}
                </span>
            );
        } else {
            parts.push(comment.text.slice(start, end));
        }

        lastIndex = end;
    }

    if (lastIndex < comment.text.length) {
        parts.push(comment.text.slice(lastIndex));
    }

    return parts;
};

const CommentItem: React.FC<{
    comment: Comment;
    mentionUsersByHandle: Map<string, MentionableUser>;
}> = ({ comment, mentionUsersByHandle }) => {
    const avatarUrl = `https://i.pravatar.cc/150?u=${comment.authorId}`;
    return (
        <div className="flex items-start gap-3">
            <img src={avatarUrl} alt={comment.authorName} className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0" />
            <div className="flex-grow bg-neutral-200/60 rounded-lg px-3 py-2">
                <p className="font-bold text-sm text-neutral-800">{comment.authorName}</p>
                <p className="text-sm text-neutral-700">
                    {renderCommentText(comment, mentionUsersByHandle)}
                </p>
            </div>
        </div>
    );
};

export const CelebrationDetailView: React.FC<CelebrationDetailViewProps> = ({ celebration, currentUser, onBack, onToggleLike, onToggleSave, onCommentAdded }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isPostingComment, setIsPostingComment] = useState(false);

    const isLiked = !!currentUser?.likedCelebrationIds.includes(celebration.id);
    const isSaved = !!currentUser?.savedCelebrationIds.includes(celebration.id);

    useEffect(() => {
        const fetchComments = async () => {
            setIsLoadingComments(true);
            try {
                const fetchedComments = await commentService.getCommentsForCelebration(celebration.id);
                setComments(fetchedComments);
            } catch (error) {
                console.error('Failed to fetch comments:', error);
            } finally {
                setIsLoadingComments(false);
            }
        };
        fetchComments();
    }, [celebration.id]);

    const mentionableUsers = useMemo(() => {
        const userMap = new Map<string, MentionableUser>();

        const addUser = (user: MentionableUser | null) => {
            if (!user) return;
            if (!userMap.has(user.id)) {
                userMap.set(user.id, user);
            }
        };

        addUser(createMentionableUser(celebration.authorId, celebration.author));
        if (currentUser) {
            const handleSource = currentUser.handle ?? buildHandle(currentUser.name, currentUser.id.toLowerCase());
            addUser({ id: currentUser.id, name: currentUser.name, handle: handleSource, avatarUrl: currentUser.avatarUrl });
        }
        comments.forEach(comment => {
            addUser(createMentionableUser(comment.authorId, comment.authorName));
            (comment.mentionedUserIds ?? []).forEach(id => {
                if (!userMap.has(id)) {
                    addUser({ id, name: id, handle: buildHandle(id, id), avatarUrl: undefined });
                }
            });
        });

        return Array.from(userMap.values());
    }, [celebration.author, celebration.authorId, comments, currentUser]);

    const mentionUsersByHandle = useMemo(() => {
        const map = new Map<string, MentionableUser>();
        mentionableUsers.forEach(user => {
            map.set(user.handle.toLowerCase(), user);
        });
        return map;
    }, [mentionableUsers]);

    const handlePostComment = async ({ text, mentionedUserIds }: { text: string; mentionedUserIds: string[] }) => {
        if (!currentUser) {
            return;
        }

        setIsPostingComment(true);
        try {
            const addedComment = await commentService.addComment(celebration.id, text, currentUser, mentionedUserIds);
            await celebrationService.incrementCommentCount(celebration.id);
            setComments(prev => [...prev, addedComment]);
            onCommentAdded(celebration.id);
        } catch (error) {
            console.error('Failed to post comment:', error);
        } finally {
            setIsPostingComment(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <header className="flex items-center gap-2 flex-shrink-0 mb-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-neutral-200 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-neutral-600" />
                </button>
                <h2 className="text-xl font-bold truncate flex-grow">{celebration.title}</h2>
                <ShareButton celebration={celebration} />
                <button onClick={() => onToggleSave(celebration.id)} className="p-2 rounded-full hover:bg-neutral-200 transition-colors group">
                     <BookmarkIcon className={`w-6 h-6 transition-all ${isSaved ? 'text-special-primary fill-special-primary/20' : 'text-neutral-500 group-hover:text-special-secondary'}`} />
                </button>
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
                           comments.map(comment => (
                               <CommentItem
                                   key={comment.id}
                                   comment={comment}
                                   mentionUsersByHandle={mentionUsersByHandle}
                               />
                           ))
                        ) : (
                            <p className="text-sm text-neutral-500 text-center py-4">Be the first to comment!</p>
                        )
                    )}
                </div>
            </div>

            {currentUser && (
                <div className="flex-shrink-0 mt-4">
                    <MentionInput
                        mentionableUsers={mentionableUsers}
                        isSubmitting={isPostingComment}
                        onSubmit={handlePostComment}
                    />
                </div>
            )}
        </div>
    );
};
