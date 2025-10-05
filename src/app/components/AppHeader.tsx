import React from "react";
import type { TabKey } from "./BottomNav";

interface AppHeaderProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  hasUnreadNotifications: boolean;
  isLoggedIn: boolean;
  isOnline: boolean;
  lastUpdatedLabel: string | null;
  pendingQueueCount: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenSearch,
  onOpenNotifications,
  hasUnreadNotifications,
  isLoggedIn,
  isOnline,
  lastUpdatedLabel,
  pendingQueueCount,
}) => {
  const isToday = activeTab === "today";

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__logo"
        onClick={() => onNavigate("today")}
        aria-label="Go to Today tab"
      >
        <span className="app-header__brand">Woon</span>
      </button>

      <div className="app-header__status" role="status">
        <span className={`app-header__status-dot ${isOnline ? "online" : "offline"}`} aria-hidden="true" />
        <span className="app-header__status-label">{isOnline ? "Online" : "Offline"}</span>
        {lastUpdatedLabel && (
          <span className="app-header__timestamp">Updated {lastUpdatedLabel}</span>
        )}
        {pendingQueueCount > 0 && (
          <span className="app-header__queue">{pendingQueueCount} pending</span>
        )}
      </div>

      <div className="app-header__actions">
        {isToday && (
          <button
            type="button"
            className="app-header__icon-button"
            onClick={onOpenSearch}
            aria-label="Search celebrations"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.75 15.75L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className={`app-header__icon-button${isLoggedIn ? "" : " app-header__icon-button--muted"}`}
          onClick={onOpenNotifications}
          aria-label="Notifications"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C8.68629 3 6 5.68629 6 9V11.586L4.293 13.293C3.90237 13.6836 3.90237 14.3168 4.293 14.7071C4.48053 14.8946 4.73478 15 5 15H19C19.5523 15 20 14.5523 20 14C20 13.7348 19.8946 13.4805 19.7071 13.293L18 11.586V9C18 5.68629 15.3137 3 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 17C9.55228 18.7252 10.5523 19.5 12 19.5C13.4477 19.5 14.4477 18.7252 15 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {hasUnreadNotifications && <span className="app-header__notification-dot" />}
        </button>
      </div>
    </header>
  );
};
