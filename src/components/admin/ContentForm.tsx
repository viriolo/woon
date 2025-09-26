import React, { useState, useEffect } from 'react'
import { contentAPI, categoryAPI, tagAPI, contentTypeAPI } from '../../api/cms'
import type {
  Content,
  ContentCreateRequest,
  ContentUpdateRequest,
  Category,
  Tag,
  ContentTypeSchema
} from '../../types/cms'

interface ContentFormProps {
  content?: Content | null
  onSave: (content: Content) => void
  onCancel: () => void
}

export default function ContentForm({ content, onSave, onCancel }: ContentFormProps) {
  const [formData, setFormData] = useState<ContentCreateRequest>({
    title: '',
    slug: '',
    content_type_id: '',
    type: 'post',
    status: 'draft',
    content: {},
    category_ids: [],
    tag_ids: []
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [contentTypes, setContentTypes] = useState<ContentTypeSchema[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, tagsData, contentTypesData] = await Promise.all([
          categoryAPI.getCategories(),
          tagAPI.getTags(),
          contentTypeAPI.getContentTypes()
        ])

        setCategories(categoriesData)
        setTags(tagsData)
        setContentTypes(contentTypesData)

        // If editing existing content, populate form
        if (content && content.id) {
          setFormData({
            title: content.title,
            slug: content.slug,
            content_type_id: content.content_type_id,
            type: content.type,
            status: content.status,
            featured_image_url: content.featured_image_url,
            excerpt: content.excerpt,
            content: content.content,
            meta_data: content.meta_data,
            seo: content.seo,
            category_ids: content.categories?.map(c => c.id) || [],
            tag_ids: content.tags?.map(t => t.id) || []
          })
        } else if (contentTypesData.length > 0) {
          // Set default content type for new content
          setFormData(prev => ({
            ...prev,
            content_type_id: contentTypesData[0].id
          }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data')
      }
    }

    loadData()
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result: Content

      if (content?.id) {
        // Update existing content
        result = await contentAPI.updateContent(content.id, formData as ContentUpdateRequest)
      } else {
        // Create new content
        result = await contentAPI.createContent(formData)
      }

      onSave(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      // Auto-generate slug if it's empty or matches the previous title's slug
      ...((!prev.slug || prev.slug === generateSlug(prev.title)) && {
        slug: generateSlug(title)
      })
    }))
  }

  const selectedContentType = contentTypes.find(ct => ct.id === formData.content_type_id)

  return (
    <div className="surface-card">
      <div className="p-6 border-b border-border-soft">
        <div className="flex justify-between items-center">
          <h2 className="text-heading">
            {content?.id ? 'Edit Content' : 'Create New Content'}
          </h2>
          <button
            onClick={onCancel}
            className="pill-button pill-muted"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-border-soft rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-border-soft rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              Content Type *
            </label>
            <select
              value={formData.content_type_id}
              onChange={(e) => setFormData(prev => ({ ...prev, content_type_id: e.target.value }))}
              className="w-full px-3 py-2 border border-border-soft rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            >
              <option value="">Select a content type</option>
              {contentTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-border-soft rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Featured Image URL
          </label>
          <input
            type="url"
            value={formData.featured_image_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
            className="w-full px-3 py-2 border border-border-soft rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Excerpt
          </label>
          <textarea
            value={formData.excerpt || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-border-soft rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="Brief description of this content..."
          />
        </div>

        {/* Content - Dynamic based on content type */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Content *
          </label>
          <textarea
            value={JSON.stringify(formData.content, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                setFormData(prev => ({ ...prev, content: parsed }))
              } catch {
                // Invalid JSON, keep the text as is for now
              }
            }}
            rows={10}
            className="w-full px-3 py-2 border border-border-soft rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
            placeholder='{"blocks": [{"type": "paragraph", "content": "Your content here..."}]}'
          />
          <p className="text-xs text-ink-500 mt-1">
            Content should be in JSON format. Future versions will have a visual editor.
          </p>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map(category => (
              <label key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.category_ids?.includes(category.id) || false}
                  onChange={(e) => {
                    const categoryIds = formData.category_ids || []
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        category_ids: [...categoryIds, category.id]
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        category_ids: categoryIds.filter(id => id !== category.id)
                      }))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Tags
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tags.map(tag => (
              <label key={tag.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.tag_ids?.includes(tag.id) || false}
                  onChange={(e) => {
                    const tagIds = formData.tag_ids || []
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        tag_ids: [...tagIds, tag.id]
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        tag_ids: tagIds.filter(id => id !== tag.id)
                      }))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4 border-t border-border-soft">
          <button
            type="button"
            onClick={onCancel}
            className="pill-button pill-muted"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="pill-button pill-accent"
            disabled={loading}
          >
            {loading ? 'Saving...' : content?.id ? 'Update Content' : 'Create Content'}
          </button>
        </div>
      </form>
    </div>
  )
}