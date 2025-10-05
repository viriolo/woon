import React from "react";

export type TabKey = "today" | "share" | "connect" | "profile";

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const ICONS: Record<TabKey, React.ReactNode> = {
  today: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10C3 7.23858 5.23858 5 8 5H16C18.7614 5 21 7.23858 21 10V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V10Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 3V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15 3V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  share: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  connect: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 14H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 19C6.48387 16.2386 9.03226 14.5 12 14.5C14.9677 14.5 17.5161 16.2386 18.5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

const NAV_ITEMS: Array<{ key: TabKey; label: string; description: string }> = [
  { key: "today", label: "Today", description: "Discover celebrations near you" },
  { key: "share", label: "Share", description: "Post your celebration" },
  { key: "connect", label: "Connect", description: "Find community events" },
  { key: "profile", label: "Profile", description: "Manage your presence" },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeTab;
        return (
          <button
            key={item.key}
            type="button"
            className={`bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
            onClick={() => onChange(item.key)}
            aria-label={item.description}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {ICONS[item.key]}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
