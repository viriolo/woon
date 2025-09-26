export type ContentStatus = 'draft' | 'published' | 'archived'
export type ContentType = 'page' | 'post' | 'event' | 'celebration' | 'custom'

export interface ContentTypeSchema {
  name: string
  slug: string
  description?: string
  schema: {
    fields: Array<{
      name: string
      type: 'text' | 'textarea' | 'richtext' | 'number' | 'date' | 'boolean' | 'object'
      required: boolean
      options?: any
    }>
  }
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  title: string
  slug: string
  content_type_id: string
  type: ContentType
  status: ContentStatus
  featured_image_url?: string
  excerpt?: string
  content: Record<string, any>
  meta_data: Record<string, any>
  seo: {
    title?: string
    description?: string
    keywords?: string[]
    og_image?: string
  }
  author_id?: string
  published_at?: string
  created_at: string
  updated_at: string

  // Relations
  content_type?: ContentTypeSchema
  categories?: Category[]
  tags?: Tag[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  sort_order: number
  created_at: string

  // Relations
  parent?: Category
  children?: Category[]
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Media {
  id: string
  filename: string
  original_filename: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  storage_path: string
  created_at: string
}

export interface ContentRevision {
  id: string
  content_id: string
  title: string
  content: Record<string, any>
  created_at: string
  created_by?: string
}

export interface CMSConfig {
  content_types: ContentTypeSchema[]
  categories: Category[]
  tags: Tag[]
}

// API Response types
export interface ContentListResponse {
  data: Content[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

export interface ContentCreateRequest {
  title: string
  slug?: string
  content_type_id: string
  type: ContentType
  status?: ContentStatus
  featured_image_url?: string
  excerpt?: string
  content: Record<string, any>
  meta_data?: Record<string, any>
  seo?: Content['seo']
  category_ids?: string[]
  tag_ids?: string[]
}

export interface ContentUpdateRequest extends Partial<ContentCreateRequest> {
  id: string
}