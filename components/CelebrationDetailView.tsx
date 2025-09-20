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
                        <span key={`${comment.id}-${index}`} className="text-special-primary font-medium">
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
            <img src={avatarUrl} alt={comment.authorName} className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0" />
            <div className="flex-grow bg-neutral-200/60 rounded-lg px-3 py-2">
                <p className="font-bold text-sm text-neutral-800">{comment.authorName}</p>
                <p className="text-sm text-neutral-700">{formattedText}</p>
            </div>
        </div>
    );
};

const composeShareMessage = (celebration: Celebration) =>
    `${celebration.title} — ${celebration.description}\n\nSee how ${celebration.author} is celebrating today on Woon!`;

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

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
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
            setTimeout(() => setShareStatus(null), 2000);
        } catch (error) {
            console.error("Share failed:", error);
            setShareStatus("Unable to share");
            setTimeout(() => setShareStatus(null), 2000);
        }
    };

    const insertMention = (name: string) => {
        const handle = name.trim().split(" ")[0].toLowerCase();
        setNewComment(prev => {
            const insertion = prev.endsWith(" ") || prev.length === 0 ? "" : " ";
            return `${prev}${insertion}@${handle} `;
        });
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <header className="flex items-center gap-4 flex-shrink-0 mb-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-neutral-200 transition-colors" aria-label="Back to celebrations">
                    <ArrowLeftIcon className="w-6 h-6 text-neutral-600" />
                </button>
                <div className="flex items-center gap-3 flex-grow overflow-hidden">
                    <h2 className="text-xl font-bold truncate flex-1">{celebration.title}</h2>
                    <button
                        onClick={() => onToggleFollow(celebration.authorId)}
                        className={`px-3 py-1 text-sm font-semibold rounded-full border transition-colors ${
                            isFollowingAuthor ? "bg-green-100 text-green-800 border-green-300" : "bg-white text-special-primary border-special-primary"
                        }`}
                    >
                        {isFollowingAuthor ? "Following" : "Follow"}
                    </button>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto space-y-4">
                <div className="relative">
                    <img src={celebration.imageUrl} alt={celebration.title} className="w-full h-48 object-cover rounded-lg" />
                    <div className="absolute top-3 right-3 flex gap-2">
                        <button
                            onClick={() => onToggleSave(celebration.id)}
                            className={`p-2 rounded-full bg-white/90 shadow transition ${isSaved ? "text-special-primary" : "text-neutral-500"}`}
                            aria-label={isSaved ? "Remove from saved" : "Save celebration"}
                        >
                            <BookmarkIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-full bg-white/90 text-neutral-600 shadow transition hover:text-special-primary"
                            aria-label="Share celebration"
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {shareStatus && (
                    <p className="text-xs text-center text-neutral-500">{shareStatus}</p>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-neutral-600">by <span className="font-bold">{celebration.author}</span></p>
                        <p className="text-xs text-neutral-400">#{celebration.authorId}</p>
                    </div>
                    <button
                        onClick={() => onToggleLike(celebration.id)}
                        className="flex items-center gap-2 p-2 rounded-full transition-colors group"
                    >
                        <HeartIcon className={`w-6 h-6 transition-all ${isLiked ? "text-red-500 scale-110" : "text-neutral-400 group-hover:text-red-400"}`} />
                        <span className="text-sm font-medium text-neutral-600">{celebration.likes}</span>
                    </button>
                </div>

                <p className="text-neutral-700">{celebration.description}</p>

                <div className="border-t border-neutral-200 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-neutral-800">Comments ({celebration.commentCount + Math.max(0, comments.length - celebration.commentCount)})</h3>
                        {mentionSuggestions.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <span>Tag friends:</span>
                                <div className="flex gap-1">
                                    {mentionSuggestions.slice(0, 3).map(friend => (
                                        <button
                                            key={friend.id}
                                            onClick={() => insertMention(friend.name)}
                                            className="px-2 py-1 bg-neutral-200 rounded-full hover:bg-neutral-300 transition"
                                        >
                                            @{friend.name.split(" ")[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
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
                        placeholder="Add a comment... use @ to mention"
                        disabled={isPostingComment}
                        className="w-full p-3 bg-white border border-neutral-300 rounded-full placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    <button type="submit" disabled={isPostingComment || !newComment.trim()} className="px-4 py-2 bg-special-primary text-white font-bold rounded-full hover:opacity-90 transition disabled:opacity-50">
                        {isPostingComment ? <LoadingSpinner className="w-5 h-5"/> : "Post"}
                    </button>
                </form>
            )}
        </div>
    );
};
