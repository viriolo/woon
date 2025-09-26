-- Create enum types for content management
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE content_type AS ENUM ('page', 'post', 'event', 'celebration', 'custom');

-- Content Types table - defines different content structures
CREATE TABLE content_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    schema JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content table - main content storage
CREATE TABLE content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content_type_id UUID REFERENCES content_types(id) ON DELETE CASCADE,
    type content_type DEFAULT 'post',
    status content_status DEFAULT 'draft',
    featured_image_url TEXT,
    excerpt TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    meta_data JSONB DEFAULT '{}',
    seo JSONB DEFAULT '{}',
    author_id UUID,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(slug, content_type_id)
);

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Categories junction table
CREATE TABLE content_categories (
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, category_id)
);

-- Content Tags junction table
CREATE TABLE content_tags (
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, tag_id)
);

-- Media library table
CREATE TABLE media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    caption TEXT,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content revisions for version control
CREATE TABLE content_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Create indexes for better performance
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_published_at ON content(published_at);
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_content_created_at ON content(created_at DESC);

-- Create functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_types_updated_at BEFORE UPDATE ON content_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();