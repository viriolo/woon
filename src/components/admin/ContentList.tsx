import React, { useState, useEffect } from 'react'
import { contentAPI } from '../../api/cms'
import type { Content, ContentListResponse } from '../../types/cms'

interface ContentListProps {
  onEdit?: (content: Content) => void
  onView?: (content: Content) => void
}

export default function ContentList({ onEdit, onView }: ContentListProps) {
  const [content, setContent] = useState<ContentListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    status: '',
    type: '',
    search: ''
  })

  const loadContent = async () => {
    try {
      setLoading(true)
      const response = await contentAPI.getContent(filters)
      setContent(response)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [filters])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      await contentAPI.deleteContent(id)
      loadContent() // Reload the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content')
    }
  }

  const handleStatusChange = async (id: string, status: 'published' | 'draft') => {
    try {
      if (status === 'published') {
        await contentAPI.publishContent(id)
      } else {
        await contentAPI.unpublishContent(id)
      }
      loadContent() // Reload the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content status')
    }
  }

  if (loading) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="text-ink-500">Loading content...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="text-red-600">Error: {error}</div>
        <button
          onClick={loadContent}
          className="pill-button pill-accent mt-4"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="surface-card">
      {/* Header */}
      <div className="p-6 border-b border-border-soft">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-heading">Content Management</h2>
          <button
            onClick={() => onEdit?.({} as Content)}
            className="pill-button pill-accent"
          >
            + New Content
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search content..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="px-3 py-2 border border-border-soft rounded-lg bg-surface"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-3 py-2 border border-border-soft rounded-lg bg-surface"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="px-3 py-2 border border-border-soft rounded-lg bg-surface"
          >
            <option value="">All Types</option>
            <option value="page">Page</option>
            <option value="post">Post</option>
            <option value="event">Event</option>
            <option value="celebration">Celebration</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="divide-y divide-border-soft">
        {content?.data.length === 0 ? (
          <div className="p-8 text-center text-ink-500">
            No content found
          </div>
        ) : (
          content?.data.map((item) => (
            <div key={item.id} className="p-6 hover:bg-app-bg-secondary/50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-ink-900">{item.title}</h3>
                    <span className={`tag-chip text-xs ${
                      item.status === 'published' ? 'bg-green-100 text-green-700' :
                      item.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                    <span className="tag-chip text-xs">
                      {item.type}
                    </span>
                  </div>

                  {item.excerpt && (
                    <p className="text-ink-600 text-sm mb-2">{item.excerpt}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-ink-500">
                    <span>Slug: {item.slug}</span>
                    <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                    {item.published_at && (
                      <span>Published: {new Date(item.published_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Categories and Tags */}
                  <div className="flex gap-2 mt-3">
                    {item.categories?.map((category) => (
                      <span key={category.id} className="tag-chip text-xs">
                        📂 {category.name}
                      </span>
                    ))}
                    {item.tags?.map((tag) => (
                      <span key={tag.id} className="tag-chip text-xs">
                        🏷️ {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {onView && (
                    <button
                      onClick={() => onView(item)}
                      className="pill-button pill-muted text-xs px-3 py-1"
                    >
                      View
                    </button>
                  )}

                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="pill-button pill-accent text-xs px-3 py-1"
                    >
                      Edit
                    </button>
                  )}

                  {item.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'published')}
                      className="pill-button text-xs px-3 py-1 bg-green-500 text-white"
                    >
                      Publish
                    </button>
                  )}

                  {item.status === 'published' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'draft')}
                      className="pill-button text-xs px-3 py-1 bg-yellow-500 text-white"
                    >
                      Unpublish
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="pill-button text-xs px-3 py-1 bg-red-500 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {content && content.total_pages > 1 && (
        <div className="p-6 border-t border-border-soft">
          <div className="flex justify-between items-center">
            <div className="text-sm text-ink-500">
              Showing {content.data.length} of {content.count} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1}
                className="pill-button pill-muted text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {filters.page} of {content.total_pages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= content.total_pages}
                className="pill-button pill-muted text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}