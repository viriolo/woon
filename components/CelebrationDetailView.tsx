import React, { useState, useEffect, useMemo } from "react";
import type { Celebration, User, Comment, FriendConnection } from "../types";
import { commentService } from "../services/commentService";
import { celebrationService } from "../services/celebrationService";
import { HeartIcon, ArrowLeftIcon, LoadingSpinner, ShareIcon, BookmarkIcon } from "./icons";

interface CelebrationDetailViewProps {
    celebration: Celebration;
    currentUser: User | null;
    onBack: () => void;
    onToggleLike: (celebrationId: number) => void;
    onToggleSave: (celebrationId: number) => void;
    onToggleFollow: (userId: string) => void;
    mentionSuggestions: FriendConnection[];
}

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
    const avatarUrl = `https://i.pravatar.cc/150?u=${comment.authorId}`;
    const formattedText = useMemo(() => {
        if (!comment.mentions?.length) {
            return comment.text;
        }
        const mentionSet = new Set(comment.mentions.map(m => m.toLowerCase()));
        return comment.text.split(/(\s+)/).map((segment, index) => {
            if (segment.startsWith("@")) {
                const value = segment.slice(1).toLowerCase();
                if (mentionSet.has(value)) {
                    return (
                        <span key={`${comment.id}-${index}`} className="text-primary font-semibold">
                            {segment}
                        </span>
                    );
                }
            }
            return <React.Fragment key={`${comment.id}-${index}`}>{segment}</React.Fragment>;
        });
    }, [comment]);

    return (
        <div className="flex items-start gap-3">
            <img src={avatarUrl} alt={comment.authorName} className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
            <div className="surface-card surface-card--tight flex-1 rounded-2xl px-4 py-3">
                <p className="text-sm font-semibold text-ink-900">{comment.authorName}</p>
                <p className="text-sm text-ink-600">{formattedText}</p>
            </div>
        </div>
    );
};

const composeShareMessage = (celebration: Celebration) =>
    `${celebration.title} - ${celebration.description}\n\nSee how ${celebration.author} is celebrating today on Woon!`;

export const CelebrationDetailView: React.FC<CelebrationDetailViewProps> = ({
    celebration,
    currentUser,
    onBack,
    onToggleLike,
    onToggleSave,
    onToggleFollow,
    mentionSuggestions,
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [shareStatus, setShareStatus] = useState<string | null>(null);

    const isLiked = !!currentUser?.likedCelebrationIds.includes(celebration.id);
    const isSaved = !!currentUser?.savedCelebrationIds.includes(celebration.id);
    const isFollowingAuthor = !!currentUser?.followingUserIds.includes(celebration.authorId);

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

    const handlePostComment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        setIsPostingComment(true);
        try {
            const addedComment = await commentService.addComment(celebration.id, newComment.trim(), currentUser);
            await celebrationService.incrementCommentCount(celebration.id);
            setComments(prev => [...prev, addedComment]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to post comment:", error);
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleShare = async () => {
        const message = composeShareMessage(celebration);
        const shareData = {
            title: celebration.title,
            text: message,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                setShareStatus("Shared!");
            } else {
                await navigator.clipboard.writeText(`${message}\n${shareData.url}`);
                setShareStatus("Copied to clipboard");
            }
            setTimeout(() => setShareStatus(null), 1800);
        } catch (error) {
            console.error("Share failed:", error);
            setShareStatus("Unable to share");
            setTimeout(() => setShareStatus(null), 1800);
        }
    };

    const insertMention = (name: string) => {
        const trimmed = newComment.trimEnd();
        const separator = trimmed.length === 0 || trimmed.endsWith("@") ? "" : " ";
        setNewComment(`${trimmed}${separator}@${name.split(" ")[0]} `);
    };

    return (
        <div className="flex flex-col gap-6">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to map
            </button>

            <div className="surface-card overflow-hidden p-0">
                <div className="relative">
                    <img src={celebration.imageUrl} alt={celebration.title} className="h-64 w-full object-cover" />
                    <div className="absolute top-3 right-3 flex gap-2">
                        <button
                            onClick={() => onToggleSave(celebration.id)}
                            className={`pill-button h-10 w-10 justify-center rounded-full bg-white/90 shadow ${isSaved ? "text-primary" : "text-ink-400"}`}
                            aria-label={isSaved ? "Remove from saved" : "Save celebration"}
                        >
                            <BookmarkIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="pill-button h-10 w-10 justify-center rounded-full bg-white/90 text-ink-500 shadow hover:text-primary"
                            aria-label="Share celebration"
                        >
                            <ShareIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="space-y-4 px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-heading text-xl">{celebration.title}</p>
                            <p className="text-sm text-ink-500">by <span className="font-semibold text-ink-700">{celebration.author}</span></p>
                            <p className="text-xs text-ink-400">#{celebration.authorId}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => onToggleFollow(celebration.authorId)} className="pill-button pill-muted">
                                {isFollowingAuthor ? "Following" : "Follow"}
                            </button>
                            <button
                                type="button"
                                onClick={() => onToggleLike(celebration.id)}
                                className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-ink-500 transition hover:text-primary"
                            >
                                <HeartIcon className={`h-5 w-5 transition ${isLiked ? "text-red-500" : ""}`} />
                                {celebration.likes}
                            </button>
                        </div>
                    </div>

                    <p className="text-sm leading-relaxed text-ink-600">{celebration.description}</p>

                    {shareStatus && <p className="text-xs text-ink-400">{shareStatus}</p>}
                </div>
            </div>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-heading text-lg">Comments ({comments.length || celebration.commentCount})</h3>
                    {mentionSuggestions.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-ink-500">
                            <span>Tag friends:</span>
                            <div className="flex gap-1">
                                {mentionSuggestions.slice(0, 3).map(friend => (
                                    <button
                                        key={friend.id}
                                        type="button"
                                        onClick={() => insertMention(friend.name)}
                                        className="tag-chip bg-white/80"
                                    >
                                        @{friend.name.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isLoadingComments ? (
                    <div className="flex justify-center py-6">
                        <LoadingSpinner className="h-6 w-6 text-primary" />
                    </div>
                ) : comments.length ? (
                    <div className="space-y-3">
                        {comments.map(comment => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </div>
                ) : (
                    <div className="surface-card surface-card--tight px-5 py-6 text-center text-sm text-ink-500">
                        Be the first to comment!
                    </div>
                )}
            </section>

            {currentUser && (
                <form onSubmit={handlePostComment} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment... use @ to mention"
                        disabled={isPostingComment}
                        className="flex-1 rounded-full border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />
                    <button type="submit" disabled={isPostingComment || !newComment.trim()} className="pill-button pill-accent">
                        {isPostingComment ? <LoadingSpinner className="h-5 w-5" /> : "Post"}
                    </button>
                </form>
            )}
        </div>
    );
};
