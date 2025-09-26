-- Insert default content types
INSERT INTO content_types (name, slug, description, schema) VALUES
('Page', 'page', 'Static pages like About, Contact, etc.', '{
  "fields": [
    {"name": "content", "type": "richtext", "required": true},
    {"name": "meta_description", "type": "text", "required": false}
  ]
}'),
('Blog Post', 'blog-post', 'Regular blog posts and articles', '{
  "fields": [
    {"name": "content", "type": "richtext", "required": true},
    {"name": "excerpt", "type": "textarea", "required": false},
    {"name": "reading_time", "type": "number", "required": false}
  ]
}'),
('Event', 'event', 'Special day events and celebrations', '{
  "fields": [
    {"name": "description", "type": "richtext", "required": true},
    {"name": "event_date", "type": "date", "required": true},
    {"name": "location", "type": "text", "required": false},
    {"name": "coordinates", "type": "object", "required": false}
  ]
}'),
('Celebration', 'celebration', 'Daily celebrations and special days', '{
  "fields": [
    {"name": "description", "type": "richtext", "required": true},
    {"name": "celebration_date", "type": "date", "required": true},
    {"name": "traditions", "type": "textarea", "required": false},
    {"name": "fun_facts", "type": "textarea", "required": false}
  ]
}');

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('General', 'general', 'General content'),
('Events', 'events', 'Event-related content'),
('Celebrations', 'celebrations', 'Special day celebrations'),
('Community', 'community', 'Community-focused content'),
('Holidays', 'holidays', 'Holiday celebrations'),
('Cultural', 'cultural', 'Cultural events and traditions');

-- Insert sample tags
INSERT INTO tags (name, slug) VALUES
('featured', 'featured'),
('popular', 'popular'),
('seasonal', 'seasonal'),
('local', 'local'),
('international', 'international'),
('family-friendly', 'family-friendly'),
('educational', 'educational'),
('entertainment', 'entertainment');

-- Insert sample content
INSERT INTO content (title, slug, content_type_id, type, status, content, published_at) VALUES
('Welcome to Woon', 'welcome-to-woon',
 (SELECT id FROM content_types WHERE slug = 'page'),
 'page', 'published',
 '{"blocks": [{"type": "paragraph", "content": "Welcome to Woon - your celebration discovery platform where every day is a special day!"}]}',
 NOW()),

('About Us', 'about-us',
 (SELECT id FROM content_types WHERE slug = 'page'),
 'page', 'published',
 '{"blocks": [{"type": "paragraph", "content": "Woon is a community engagement platform that helps you discover and celebrate special days in your neighborhood."}]}',
 NOW());

-- Link content to categories
INSERT INTO content_categories (content_id, category_id) VALUES
((SELECT id FROM content WHERE slug = 'welcome-to-woon'), (SELECT id FROM categories WHERE slug = 'general')),
((SELECT id FROM content WHERE slug = 'about-us'), (SELECT id FROM categories WHERE slug = 'general'));

-- Link content to tags
INSERT INTO content_tags (content_id, tag_id) VALUES
((SELECT id FROM content WHERE slug = 'welcome-to-woon'), (SELECT id FROM tags WHERE slug = 'featured'));