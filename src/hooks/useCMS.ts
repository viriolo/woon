import { useState, useEffect, useCallback } from 'react'
import { contentAPI } from '../api/cms'
import type { Content, ContentListResponse } from '../types/cms'

// Hook for fetching published content
export function usePublishedContent(options: {
  type?: string
  category?: string
  tag?: string
  search?: string
  per_page?: number
} = {}) {
  const [data, setData] = useState<ContentListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const response = await contentAPI.getPublishedContent({
        ...options,
        page
      })

      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content')
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  return {
    content: data?.data || [],
    pagination: {
      page: data?.page || 1,
      per_page: data?.per_page || 20,
      total_pages: data?.total_pages || 0,
      count: data?.count || 0
    },
    loading,
    error,
    refetch: fetchContent,
    loadMore: (page: number) => fetchContent(page)
  }
}

// Hook for fetching a single published content by slug
export function usePublishedContentBySlug(slug: string | null) {
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    if (!slug) return

    try {
      setLoading(true)
      setError(null)

      const response = await contentAPI.getContentBySlug(slug)
      setContent(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (slug) {
      fetchContent()
    } else {
      setContent(null)
      setLoading(false)
      setError(null)
    }
  }, [slug, fetchContent])

  return {
    content,
    loading,
    error,
    refetch: fetchContent
  }
}

// Hook for fetching content by type (events, celebrations, etc.)
export function useContentByType(type: string, options: {
  limit?: number
  category?: string
  tag?: string
} = {}) {
  return usePublishedContent({
    type,
    per_page: options.limit || 20,
    category: options.category,
    tag: options.tag
  })
}

// Specific hooks for different content types
export function useEvents(options?: { limit?: number; category?: string }) {
  return useContentByType('event', options)
}

export function useCelebrations(options?: { limit?: number; category?: string }) {
  return useContentByType('celebration', options)
}

export function useBlogPosts(options?: { limit?: number; category?: string }) {
  return useContentByType('post', options)
}

export function usePages() {
  return useContentByType('page')
}

// Hook for searching content
export function useContentSearch(query: string) {
  const [results, setResults] = useState<Content[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await contentAPI.getPublishedContent({
        search: searchQuery,
        per_page: 50
      })

      setResults(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search content')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [query, search])

  return {
    results,
    loading,
    error,
    search
  }
}