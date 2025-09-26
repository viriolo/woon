# Woon Headless CMS

This project has been converted into a headless CMS using Supabase. The CMS provides a flexible content management system for managing pages, blog posts, events, celebrations, and custom content types.

## Features

- **Flexible Content Types**: Support for pages, blog posts, events, celebrations, and custom content types
- **Rich Metadata**: Categories, tags, SEO metadata, featured images
- **Content Versioning**: Track content revisions and changes
- **Media Management**: Built-in media library with file upload
- **Draft/Publish Workflow**: Content status management
- **API-First**: RESTful API for content consumption
- **React Hooks**: Pre-built hooks for easy content fetching

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup

Run the migrations to create the CMS schema:

```bash
# Apply the migrations to your Supabase database
# You can run these SQL files in your Supabase SQL editor
# or use the Supabase CLI if you have it set up
```

The migrations will create:
- Content types and content tables
- Categories and tags system
- Media library
- Content revisions
- Proper indexes and constraints

### 3. Admin Interface

Access the admin interface through the `AdminDashboard` component:

```tsx
import AdminDashboard from './components/admin/AdminDashboard'

// Render the admin dashboard
<AdminDashboard />
```

## Usage

### Fetching Content (Public API)

Use the provided React hooks to fetch content in your components:

```tsx
import { usePublishedContent, useContentBySlug, useEvents, useCelebrations } from './hooks/useCMS'

// Get all published content
const { content, loading, error, pagination } = usePublishedContent({
  type: 'post',
  category: 'events',
  per_page: 10
})

// Get specific content by slug
const { content, loading, error } = useContentBySlug('welcome-to-woon')

// Get events
const { content: events } = useEvents({ limit: 5 })

// Get celebrations
const { content: celebrations } = useCelebrations({ limit: 10 })
```

### Direct API Usage

You can also use the API directly:

```tsx
import { contentAPI, categoryAPI, tagAPI } from './api/cms'

// Get published content
const content = await contentAPI.getPublishedContent({
  page: 1,
  per_page: 20,
  type: 'event'
})

// Get single content
const post = await contentAPI.getContentBySlug('my-post-slug')

// Get categories and tags
const categories = await categoryAPI.getCategories()
const tags = await tagAPI.getTags()
```

### Content Management

Create, update, and manage content:

```tsx
// Create new content
const newContent = await contentAPI.createContent({
  title: 'My New Event',
  slug: 'my-new-event',
  content_type_id: 'event-content-type-id',
  type: 'event',
  status: 'published',
  content: {
    description: 'This is a great event!',
    event_date: '2024-12-25',
    location: 'Downtown'
  },
  category_ids: ['events-category-id'],
  tag_ids: ['holiday-tag-id']
})

// Update content
const updatedContent = await contentAPI.updateContent(contentId, {
  title: 'Updated Title',
  status: 'published'
})

// Delete content
await contentAPI.deleteContent(contentId)
```

## Content Types

The CMS comes with predefined content types:

### Page
Static pages like About, Contact, etc.
```json
{
  "content": "Rich text content",
  "meta_description": "SEO description"
}
```

### Blog Post
Regular blog posts and articles
```json
{
  "content": "Article content",
  "excerpt": "Brief summary",
  "reading_time": 5
}
```

### Event
Special day events and celebrations
```json
{
  "description": "Event description",
  "event_date": "2024-12-25",
  "location": "Event location",
  "coordinates": {"lat": 40.7128, "lng": -74.0060}
}
```

### Celebration
Daily celebrations and special days
```json
{
  "description": "Celebration description",
  "celebration_date": "2024-12-25",
  "traditions": "Traditional activities",
  "fun_facts": "Interesting facts"
}
```

## Database Schema

The CMS uses the following main tables:

- `content_types`: Defines content type schemas
- `content`: Main content storage
- `categories`: Hierarchical category system
- `tags`: Simple tagging system
- `content_categories`: Many-to-many relationship
- `content_tags`: Many-to-many relationship
- `media`: Media library
- `content_revisions`: Content version history

## Customization

### Adding New Content Types

1. Insert a new content type in the `content_types` table:
```sql
INSERT INTO content_types (name, slug, description, schema) VALUES
('Custom Type', 'custom-type', 'Description', '{
  "fields": [
    {"name": "custom_field", "type": "text", "required": true}
  ]
}');
```

2. Use the content type when creating content:
```tsx
const content = await contentAPI.createContent({
  title: 'My Custom Content',
  content_type_id: 'custom-type-id',
  type: 'custom',
  content: {
    custom_field: 'Custom value'
  }
})
```

### Extending the Admin Interface

The admin components are modular and can be extended:

- `ContentList`: Display and manage content
- `ContentForm`: Create and edit content
- `AdminDashboard`: Main admin interface

## API Reference

See the TypeScript definitions in `src/types/cms.ts` for complete API documentation.

## Security

- Use Supabase Row Level Security (RLS) policies to control access
- Implement proper authentication for admin functions
- Validate content before saving
- Sanitize user input

## Performance

- Content is indexed by status, type, and publication date
- Use pagination for large content lists
- Consider caching frequently accessed content
- Optimize images in the media library