import React from 'react'

interface CMSNavigationProps {
  onNavigate: (tab: string) => void
}

export default function CMSNavigation({ onNavigate }: CMSNavigationProps) {
  return (
    <div className="surface-card p-4 mb-4">
      <div className="section-heading mb-3">🎛️ CMS Management</div>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => onNavigate('cms-test')}
          className="pill-button pill-muted"
        >
          🧪 Test CMS
        </button>
        <button
          onClick={() => onNavigate('cms-admin')}
          className="pill-button pill-accent"
        >
          ⚙️ Admin Dashboard
        </button>
        <button
          onClick={() => onNavigate('profile')}
          className="pill-button pill-muted"
        >
          ← Back to Profile
        </button>
      </div>
    </div>
  )
}