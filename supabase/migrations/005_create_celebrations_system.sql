/*
  # Create Celebrations System

  1. New Tables
    - `celebrations`
      - `id` (bigserial, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `location_lng` (double precision)
      - `location_lat` (double precision)
      - `likes_count` (integer, default 0)
      - `comments_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `celebration_comments`
      - `id` (uuid, primary key)
      - `celebration_id` (bigint, references celebrations)
      - `user_id` (uuid, references user_profiles)
      - `text` (text)
      - `mentions` (jsonb, array of mentioned user handles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Anyone can view published celebrations
    - Only authenticated users can create celebrations
    - Users can update/delete their own celebrations
    - Anyone can view comments
    - Only authenticated users can create comments
*/

-- Create celebrations table
CREATE TABLE IF NOT EXISTS celebrations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    location_lng DOUBLE PRECISION,
    location_lat DOUBLE PRECISION,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create celebration_comments table
CREATE TABLE IF NOT EXISTS celebration_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    celebration_id BIGINT NOT NULL REFERENCES celebrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_celebrations_user_id ON celebrations(user_id);
CREATE INDEX IF NOT EXISTS idx_celebrations_created_at ON celebrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_celebrations_location ON celebrations(location_lng, location_lat);
CREATE INDEX IF NOT EXISTS idx_celebration_comments_celebration ON celebration_comments(celebration_id);
CREATE INDEX IF NOT EXISTS idx_celebration_comments_user ON celebration_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_celebration_comments_created_at ON celebration_comments(created_at);

-- Create trigger for celebrations updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_celebrations_updated_at'
    ) THEN
        CREATE TRIGGER update_celebrations_updated_at
            BEFORE UPDATE ON celebrations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_user_profiles();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for celebrations
CREATE POLICY "Anyone can view celebrations" ON celebrations
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create celebrations" ON celebrations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own celebrations" ON celebrations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own celebrations" ON celebrations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for celebration_comments
CREATE POLICY "Anyone can view comments" ON celebration_comments
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create comments" ON celebration_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON celebration_comments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON celebration_comments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_celebration_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE celebrations
        SET likes_count = likes_count + 1
        WHERE id = NEW.celebration_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE celebrations
        SET likes_count = likes_count - 1
        WHERE id = OLD.celebration_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update comments count
CREATE OR REPLACE FUNCTION update_celebration_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE celebrations
        SET comments_count = comments_count + 1
        WHERE id = NEW.celebration_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE celebrations
        SET comments_count = comments_count - 1
        WHERE id = OLD.celebration_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'celebration_likes_count_trigger'
    ) THEN
        CREATE TRIGGER celebration_likes_count_trigger
            AFTER INSERT OR DELETE ON celebration_likes
            FOR EACH ROW EXECUTE FUNCTION update_celebration_likes_count();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'celebration_comments_count_trigger'
    ) THEN
        CREATE TRIGGER celebration_comments_count_trigger
            AFTER INSERT OR DELETE ON celebration_comments
            FOR EACH ROW EXECUTE FUNCTION update_celebration_comments_count();
    END IF;
END $$;
