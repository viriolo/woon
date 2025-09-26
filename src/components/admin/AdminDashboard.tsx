import React, { useState } from 'react'
import ContentList from './ContentList'
import ContentForm from './ContentForm'
import type { Content } from '../../types/cms'

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'view'>('list')
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)

  const handleEdit = (content: Content) => {
    setSelectedContent(content)
    setCurrentView('form')
  }

  const handleView = (content: Content) => {
    setSelectedContent(content)
    setCurrentView('view')
  }

  const handleSave = (content: Content) => {
    setCurrentView('list')
    setSelectedContent(null)
  }

  const handleCancel = () => {
    setCurrentView('list')
    setSelectedContent(null)
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="app-shell">
        {/* Header */}
        <header className="glass-panel m-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-ink-900">Woon CMS</h1>
              <p className="text-ink-600 mt-1">Content Management System</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('list')}
                className={`pill-button ${currentView === 'list' ? 'pill-accent' : 'pill-muted'}`}
              >
                📝 Content
              </button>
              <button
                onClick={() => handleEdit({} as Content)}
                className="pill-button pill-accent"
              >
                + New Content
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-6 mb-6">
          {currentView === 'list' && (
            <ContentList
              onEdit={handleEdit}
              onView={handleView}
            />
          )}

          {currentView === 'form' && (
            <ContentForm
              content={selectedContent}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}

          {currentView === 'view' && selectedContent && (
            <div className="surface-card">
              <div className="p-6 border-b border-border-soft">
                <div className="flex justify-between items-center">
                  <h2 className="text-heading">View Content</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(selectedContent)}
                      className="pill-button pill-accent"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleCancel}
                      className="pill-button pill-muted"
                    >
                      Back to List
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-ink-900 mb-2">
                      {selectedContent.title}
                    </h1>
                    <div className="flex gap-2 mb-4">
                      <span className={`tag-chip ${
                        selectedContent.status === 'published' ? 'bg-green-100 text-green-700' :
                        selectedContent.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedContent.status}
                      </span>
                      <span className="tag-chip">
                        {selectedContent.type}
                      </span>
                    </div>
                  </div>

                  {selectedContent.featured_image_url && (
                    <div className="mb-6">
                      <img
                        src={selectedContent.featured_image_url}
                        alt={selectedContent.title}
                        className="max-w-full h-auto rounded-lg shadow-sm"
                      />
                    </div>
                  )}

                  {selectedContent.excerpt && (
                    <div className="bg-accent-soft p-4 rounded-lg mb-6">
                      <p className="text-ink-700 italic">{selectedContent.excerpt}</p>
                    </div>
                  )}

                  <div className="bg-surface-strong p-4 rounded-lg">
                    <h3 className="font-semibold text-ink-900 mb-2">Content Data</h3>
                    <pre className="text-sm text-ink-600 overflow-auto">
                      {JSON.stringify(selectedContent.content, null, 2)}
                    </pre>
                  </div>

                  {selectedContent.categories && selectedContent.categories.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-ink-900 mb-2">Categories</h3>
                      <div className="flex gap-2 flex-wrap">
                        {selectedContent.categories.map(category => (
                          <span key={category.id} className="tag-chip">
                            📂 {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedContent.tags && selectedContent.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-ink-900 mb-2">Tags</h3>
                      <div className="flex gap-2 flex-wrap">
                        {selectedContent.tags.map(tag => (
                          <span key={tag.id} className="tag-chip">
                            🏷️ {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-ink-500">
                    <div>
                      <strong>Slug:</strong> {selectedContent.slug}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(selectedContent.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Updated:</strong> {new Date(selectedContent.updated_at).toLocaleDateString()}
                    </div>
                    {selectedContent.published_at && (
                      <div>
                        <strong>Published:</strong> {new Date(selectedContent.published_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="m-6 mt-12 text-center text-ink-400 text-sm">
          <p>Woon CMS - Powered by Supabase</p>
        </footer>
      </div>
    </div>
  )
}