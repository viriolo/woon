import { supabase } from './supabase'
import type {
  Content,
  ContentCreateRequest,
  ContentUpdateRequest,
  ContentListResponse,
  Category,
  Tag,
  ContentTypeSchema,
  Media
} from '../types/cms'

// Content operations
export class ContentService {
  // Get all content with pagination and filters
  static async getContent(options: {
    page?: number
    per_page?: number
    status?: string
    type?: string
    category?: string
    tag?: string
    search?: string
  } = {}): Promise<ContentListResponse> {
    const {
      page = 1,
      per_page = 20,
      status,
      type,
      category,
      tag,
      search
    } = options

    let query = supabase
      .from('content')
      .select(`
        *,
        content_type:content_types(*),
        categories:content_categories(category:categories(*)),
        tags:content_tags(tag:tags(*))
      `, { count: 'exact' })

    // Apply filters
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (search) {
      query = query.or(`title.ilike.%${search}%, excerpt.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * per_page
    query = query.range(from, from + per_page - 1)

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) throw error

    // Transform the data to include categories and tags properly
    const transformedData = data?.map(item => ({
      ...item,
      categories: item.categories?.map((cc: any) => cc.category) || [],
      tags: item.tags?.map((ct: any) => ct.tag) || []
    })) || []

    return {
      data: transformedData,
      count: count || 0,
      page,
      per_page,
      total_pages: Math.ceil((count || 0) / per_page)
    }
  }

  // Get single content by ID or slug
  static async getContentBySlug(slug: string): Promise<Content | null> {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        content_type:content_types(*),
        categories:content_categories(category:categories(*)),
        tags:content_tags(tag:tags(*))
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // Transform the data
    return {
      ...data,
      categories: data.categories?.map((cc: any) => cc.category) || [],
      tags: data.tags?.map((ct: any) => ct.tag) || []
    }
  }

  static async getContentById(id: string): Promise<Content | null> {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        content_type:content_types(*),
        categories:content_categories(category:categories(*)),
        tags:content_tags(tag:tags(*))
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return {
      ...data,
      categories: data.categories?.map((cc: any) => cc.category) || [],
      tags: data.tags?.map((ct: any) => ct.tag) || []
    }
  }

  // Create new content
  static async createContent(content: ContentCreateRequest): Promise<Content> {
    // Generate slug if not provided
    if (!content.slug) {
      content.slug = this.generateSlug(content.title)
    }

    const { data, error } = await supabase
      .from('content')
      .insert({
        title: content.title,
        slug: content.slug,
        content_type_id: content.content_type_id,
        type: content.type,
        status: content.status || 'draft',
        featured_image_url: content.featured_image_url,
        excerpt: content.excerpt,
        content: content.content,
        meta_data: content.meta_data || {},
        seo: content.seo || {},
        published_at: content.status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) throw error

    // Handle categories and tags
    if (content.category_ids?.length) {
      await this.updateContentCategories(data.id, content.category_ids)
    }
    if (content.tag_ids?.length) {
      await this.updateContentTags(data.id, content.tag_ids)
    }

    return this.getContentById(data.id) as Promise<Content>
  }

  // Update content
  static async updateContent(id: string, updates: Partial<ContentUpdateRequest>): Promise<Content> {
    const { data, error } = await supabase
      .from('content')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Handle categories and tags updates
    if (updates.category_ids !== undefined) {
      await this.updateContentCategories(id, updates.category_ids)
    }
    if (updates.tag_ids !== undefined) {
      await this.updateContentTags(id, updates.tag_ids)
    }

    return this.getContentById(id) as Promise<Content>
  }

  // Delete content
  static async deleteContent(id: string): Promise<void> {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Helper methods
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private static async updateContentCategories(contentId: string, categoryIds: string[]): Promise<void> {
    // Remove existing categories
    await supabase
      .from('content_categories')
      .delete()
      .eq('content_id', contentId)

    // Add new categories
    if (categoryIds.length > 0) {
      const { error } = await supabase
        .from('content_categories')
        .insert(
          categoryIds.map(categoryId => ({
            content_id: contentId,
            category_id: categoryId
          }))
        )

      if (error) throw error
    }
  }

  private static async updateContentTags(contentId: string, tagIds: string[]): Promise<void> {
    // Remove existing tags
    await supabase
      .from('content_tags')
      .delete()
      .eq('content_id', contentId)

    // Add new tags
    if (tagIds.length > 0) {
      const { error } = await supabase
        .from('content_tags')
        .insert(
          tagIds.map(tagId => ({
            content_id: contentId,
            tag_id: tagId
          }))
        )

      if (error) throw error
    }
  }
}

// Category operations
export class CategoryService {
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Tag operations
export class TagService {
  static async getTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async createTag(tag: Omit<Tag, 'id' | 'created_at'>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Content Type operations
export class ContentTypeService {
  static async getContentTypes(): Promise<ContentTypeSchema[]> {
    const { data, error } = await supabase
      .from('content_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }
}

// Media operations
export class MediaService {
  static async getMedia(): Promise<Media[]> {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async uploadFile(file: File): Promise<Media> {
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `media/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    // Save media record to database
    const { data, error } = await supabase
      .from('media')
      .insert({
        filename: fileName,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: publicUrl
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}