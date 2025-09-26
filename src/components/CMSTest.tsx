import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { contentAPI } from '../api/cms'

export default function CMSTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [tables, setTables] = useState<string[]>([])
  const [content, setContent] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test basic Supabase connection
      const { data: authData } = await supabase.auth.getSession()

      // Test if tables exist
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('get_schema_tables')
        .single()

      if (tablesError) {
        // Fallback: try to query content table directly
        const { data, error: contentError } = await supabase
          .from('content')
          .select('id, title, slug, status, type')
          .limit(5)

        if (contentError) {
          throw new Error(`Content table query failed: ${contentError.message}`)
        }

        setContent(data || [])
        setConnectionStatus('connected')
        return
      }

      // If we get here, connection is good
      setConnectionStatus('connected')

      // Load initial content using our API
      const contentData = await contentAPI.getContent({ per_page: 5 })
      setContent(contentData.data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setConnectionStatus('error')
    }
  }

  const createTestContent = async () => {
    try {
      const testContent = await contentAPI.createContent({
        title: 'Test Content',
        slug: 'test-content-' + Date.now(),
        content_type_id: '', // Will be filled with first available content type
        type: 'post',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'paragraph',
              content: 'This is a test content created from the CMS test component!'
            }
          ]
        }
      })

      alert('Test content created successfully!')
      testConnection() // Reload content
    } catch (err) {
      alert('Failed to create test content: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  return (
    <div className="surface-card p-6 m-6">
      <h2 className="text-heading mb-4">🧪 CMS Connection Test</h2>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <span className="font-medium">Status:</span>
          {connectionStatus === 'testing' && (
            <span className="tag-chip bg-yellow-100 text-yellow-700">🔄 Testing...</span>
          )}
          {connectionStatus === 'connected' && (
            <span className="tag-chip bg-green-100 text-green-700">✅ Connected</span>
          )}
          {connectionStatus === 'error' && (
            <span className="tag-chip bg-red-100 text-red-700">❌ Error</span>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success Content */}
        {connectionStatus === 'connected' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <strong>✅ CMS is working!</strong> Your Supabase connection is successful.
            </div>

            {/* Content List */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Content ({content.length} items)</h3>
                <button
                  onClick={createTestContent}
                  className="pill-button pill-accent text-sm"
                >
                  + Create Test Content
                </button>
              </div>

              {content.length === 0 ? (
                <p className="text-ink-500 italic">No content found. Create some content to get started!</p>
              ) : (
                <div className="space-y-2">
                  {content.map((item, index) => (
                    <div key={item.id || index} className="p-3 bg-surface-strong rounded-lg border border-border-soft">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-ink-600">
                            Slug: {item.slug} | Type: {item.type} | Status: {item.status}
                          </p>
                        </div>
                        <span className={`tag-chip text-xs ${
                          item.status === 'published' ? 'bg-green-100 text-green-700' :
                          item.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">🎉 Ready to use!</h4>
              <p className="text-blue-700 text-sm mb-3">
                Your CMS is now fully functional. You can:
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Use the admin dashboard to manage content</li>
                <li>• Fetch content with the provided hooks</li>
                <li>• Create new content types and categories</li>
                <li>• Build your frontend with the CMS data</li>
              </ul>
            </div>
          </div>
        )}

        {/* Retry Button */}
        <button
          onClick={testConnection}
          className="pill-button pill-muted"
        >
          🔄 Test Connection Again
        </button>
      </div>
    </div>
  )
}