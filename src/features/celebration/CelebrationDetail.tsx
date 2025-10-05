import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Celebration, Comment, User } from "../../types";
import { commentService } from "../../../services/commentService";
import { useAuth } from "../../contexts/AuthContext";
import type { AuthUser } from "../../services/authService";
import type { OfflineActionInput, OfflineAction } from "../../utils/offlineQueue";

interface CelebrationDetailProps {
  celebration: Celebration;
  onClose: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  requireAuth: (message: string, action?: () => void) => boolean;
  isGuest: boolean;
  isOnline: boolean;
  enqueueOfflineAction: (action: OfflineActionInput) => OfflineAction;
}

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-.06-.06a5.5 5.5 0 0 0-7.78 7.78l.06.06L12 21l7.78-7.55.06-.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BookmarkIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    width="16"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
  </svg>
);

const authUserToUser = (authUser: AuthUser): User => ({
  id: authUser.id,
  name: authUser.name,
  email: authUser.email,
  avatarUrl: authUser.avatarUrl,
  handle: authUser.handle,
  bio: authUser.bio,
  location: authUser.location,
  notificationPreferences: authUser.notificationPreferences,
  likedCelebrationIds: authUser.likedCelebrationIds.map(Number),
  savedCelebrationIds: authUser.savedCelebrationIds.map(Number),
  rsvpedEventIds: authUser.rsvpedEventIds,
  followingUserIds: authUser.followingUserIds,
  followerUserIds: authUser.followerUserIds,
  followingCount: authUser.followingCount,
  followersCount: authUser.followersCount,
  streakDays: authUser.streakDays,
  experiencePoints: authUser.experiencePoints,
  achievements: authUser.achievements,
  level: authUser.level,
});

export const CelebrationDetail: React.FC<CelebrationDetailProps> = ({
  celebration,
  onClose,
  onToggleLike,
  onToggleSave,
  requireAuth,
  isGuest,
  isOnline,
  enqueueOfflineAction,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const commentListRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isLiked = useMemo(
    () => (user ? user.likedCelebrationIds.includes(celebration.id) : false),
    [user, celebration.id]
  );

  const isSaved = useMemo(
    () => (user ? user.savedCelebrationIds.includes(celebration.id) : false),
    [user, celebration.id]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoadingComments(true);
        const loaded = await commentService.getCommentsForCelebration(celebration.id);
        if (!cancelled) {
          const sorted = [...loaded].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setComments(sorted);
        }
      } catch (error) {
        console.error("Failed to load comments", error);
      } finally {
        if (!cancelled) {
          setIsLoadingComments(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [celebration.id]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ offlineId: string; celebrationId: number; comment: Comment }>;
      if (custom.detail.celebrationId !== celebration.id) {
        return;
      }
      setComments((prev) => {
        const withoutPending = prev.filter((comment) => comment.id !== custom.detail.offlineId);
        return [custom.detail.comment, ...withoutPending.filter((comment) => comment.id !== custom.detail.comment.id)];
      });
    };

    window.addEventListener("woon-offline-comment-synced", handler as EventListener);
    return () => {
      window.removeEventListener("woon-offline-comment-synced", handler as EventListener);
    };
  }, [celebration.id]);

  const handleSubmitComment = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (!requireAuth("Sign in to add a comment", () => inputRef.current?.focus())) {
      return;
    }

    if (!user) return;

    if (!isOnline) {
      const offlineEntry = enqueueOfflineAction({
        type: "comment",
        payload: {
          celebrationId: celebration.id,
          text: trimmed,
          createdAt: new Date().toISOString(),
          userSnapshot: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          },
        },
      });
      if (!offlineEntry) {
        setShareError("We need storage permission to queue offline comments.");
        return;
      }
      const pendingComment: Comment = {
        id: offlineEntry.id,
        celebrationId: celebration.id,
        authorId: user.id,
        authorName: user.name,
        authorAvatarUrl: user.avatarUrl,
        text: trimmed,
        timestamp: new Date().toISOString(),
        mentions: [],
        pending: true,
      };
      setComments((prev) => [pendingComment, ...prev]);
      setCommentText("");
      commentListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const mappedUser = authUserToUser(user);
      const newComment = await commentService.addComment(celebration.id, trimmed, mappedUser);
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      commentListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    } catch (error) {
      console.error("Unable to add comment", error);
    }
  };

  const handleShare = async () => {
    if (!requireAuth("Sign in to share celebrations")) {
      return;
    }

    try {
      setIsSharing(true);
      setShareError(null);
      const shareData = {
        title: celebration.title,
        text: `${celebration.title} on Woon`,
        url: window.location.href + `#celebration-${celebration.id}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setShareError("Link copied to clipboard");
      }

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (error) {
      console.error("Share failed", error);
      setShareError("Unable to share right now");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="celebration-detail">
      <button type="button" className="celebration-detail__close" onClick={onClose}>
        Close
      </button>

      <div className="celebration-detail__media">
        <img src={celebration.imageUrl} alt={celebration.title} />
      </div>

      <header className="celebration-detail__header">
        <h3 className="celebration-detail__title">{celebration.title}</h3>
        <p className="celebration-detail__author">Shared by {celebration.author}</p>
      </header>

      {celebration.description && (
        <p className="celebration-detail__description">{celebration.description}</p>
      )}

      <div className="celebration-detail__actions">
        <button
          type="button"
          className={`detail-action detail-action--like${isLiked ? " detail-action--active" : ""}`}
          onClick={onToggleLike}
          aria-pressed={isLiked}
        >
          <HeartIcon filled={isLiked} />
          <span>{celebration.likes + (isLiked ? 1 : 0)}</span>
        </button>
        <button
          type="button"
          className={`detail-action detail-action--save${isSaved ? " detail-action--active" : ""}`}
          onClick={onToggleSave}
          aria-pressed={isSaved}
        >
          <BookmarkIcon filled={isSaved} />
        </button>
        <button
          type="button"
          className="detail-action detail-action--share"
          onClick={handleShare}
          disabled={isSharing}
        >
          {isSharing ? "Sharing..." : "Share"}
        </button>
      </div>

      {shareError && <p className="celebration-detail__share-feedback">{shareError}</p>}

      <section className="celebration-detail__comments">
        <header className="celebration-detail__comments-header">
          <h4>Comments</h4>
          <span>{comments.length}</span>
        </header>

        {isLoadingComments ? (
          <p className="celebration-detail__comments-loading">Loading conversations...</p>
        ) : comments.length === 0 ? (
          <p className="celebration-detail__comments-empty">Be the first to add some joy!</p>
        ) : (
          <ul ref={commentListRef} className="celebration-detail__comment-list" aria-live="polite">
            {comments.map((comment) => (
              <li key={comment.id} className="celebration-comment">
                <div className="celebration-comment__avatar">
                  {comment.authorAvatarUrl ? (
                    <img src={comment.authorAvatarUrl} alt={`${comment.authorName}'s avatar`} />
                  ) : (
                    <span>{comment.authorName.slice(0, 1)}</span>
                  )}
                </div>
                <div className="celebration-comment__content">
                  <div className="celebration-comment__meta">
                    <span className="celebration-comment__author">{comment.authorName}</span>
                    <time dateTime={comment.timestamp}>
                      {new Date(comment.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                  <p className="celebration-comment__text">{comment.text}</p>
                  {comment.pending && <span className="celebration-comment__pending">Pending sync…</span>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmitComment} className="celebration-detail__comment-form">
          <label className="visually-hidden" htmlFor="celebration-comment-input">
            Add a comment
          </label>
          <input
            ref={inputRef}
            id="celebration-comment-input"
            type="text"
            value={commentText}
            onFocus={() => {
              if (isGuest && !requireAuth("Sign in to add a comment", () => inputRef.current?.focus())) {
                inputRef.current?.blur();
              }
            }}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder={isGuest ? "Sign in to add a comment" : "Add a comment..."}
          />
          <button
            type="submit"
            className="comment-send-btn"
            aria-label="Send comment"
            disabled={!commentText.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 11.5L20 4L12.5 20L11 13L4 11.5Z" fill="currentColor" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
};
