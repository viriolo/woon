import {
  ContentService,
  CategoryService,
  TagService,
  ContentTypeService,
  MediaService
} from '../lib/cms'
import type {
  ContentCreateRequest,
  ContentUpdateRequest,
  ContentListResponse
} from '../types/cms'

// Content API
export const contentAPI = {
  // Get all content with filters and pagination
  async getContent(params: {
    page?: number
    per_page?: number
    status?: string
    type?: string
    category?: string
    tag?: string
    search?: string
  } = {}): Promise<ContentListResponse> {
    return ContentService.getContent(params)
  },

  // Get published content for public consumption
  async getPublishedContent(params: {
    page?: number
    per_page?: number
    type?: string
    category?: string
    tag?: string
    search?: string
  } = {}): Promise<ContentListResponse> {
    return ContentService.getContent({ ...params, status: 'published' })
  },

  // Get single content by slug (public)
  async getContentBySlug(slug: string) {
    return ContentService.getContentBySlug(slug)
  },

  // Get single content by ID (admin)
  async getContentById(id: string) {
    return ContentService.getContentById(id)
  },

  // Create new content
  async createContent(content: ContentCreateRequest) {
    return ContentService.createContent(content)
  },

  // Update existing content
  async updateContent(id: string, updates: Partial<ContentUpdateRequest>) {
    return ContentService.updateContent(id, updates)
  },

  // Delete content
  async deleteContent(id: string) {
    return ContentService.deleteContent(id)
  },

  // Publish content
  async publishContent(id: string) {
    return ContentService.updateContent(id, {
      status: 'published',
      published_at: new Date().toISOString()
    })
  },

  // Unpublish content
  async unpublishContent(id: string) {
    return ContentService.updateContent(id, {
      status: 'draft'
    })
  }
}

// Category API
export const categoryAPI = {
  async getCategories() {
    return CategoryService.getCategories()
  },

  async createCategory(category: { name: string; slug: string; description?: string; parent_id?: string; sort_order?: number }) {
    return CategoryService.createCategory(category)
  }
}

// Tag API
export const tagAPI = {
  async getTags() {
    return TagService.getTags()
  },

  async createTag(tag: { name: string; slug: string }) {
    return TagService.createTag(tag)
  }
}

// Content Type API
export const contentTypeAPI = {
  async getContentTypes() {
    return ContentTypeService.getContentTypes()
  }
}

// Media API
export const mediaAPI = {
  async getMedia() {
    return MediaService.getMedia()
  },

  async uploadFile(file: File) {
    return MediaService.uploadFile(file)
  }
}

// Combined CMS API
export const cmsAPI = {
  content: contentAPI,
  categories: categoryAPI,
  tags: tagAPI,
  contentTypes: contentTypeAPI,
  media: mediaAPI
}

// Export default for convenience
export default cmsAPI