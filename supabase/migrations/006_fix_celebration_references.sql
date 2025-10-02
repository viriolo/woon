/*
  # Fix Celebration Table References
  
  The celebration_likes and celebration_saves tables in migration 003 were incorrectly
  referencing content(id) instead of celebrations(id). This migration fixes those references.
  
  Since the celebrations table is created in migration 005, we need to:
  1. Drop the existing tables with wrong references
  2. Recreate them with correct references to celebrations(id)
  3. Update the data type for celebration_id to match celebrations.id (BIGINT)
*/

-- Drop existing tables with wrong references
DROP TABLE IF EXISTS celebration_likes CASCADE;
DROP TABLE IF EXISTS celebration_saves CASCADE;

-- Recreate celebration_likes table with correct references
CREATE TABLE celebration_likes (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    celebration_id BIGINT REFERENCES celebrations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, celebration_id)
);

-- Recreate celebration_saves table with correct references
CREATE TABLE celebration_saves (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    celebration_id BIGINT REFERENCES celebrations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, celebration_id)
);

-- Recreate indexes
CREATE INDEX idx_celebration_likes_user ON celebration_likes(user_id);
CREATE INDEX idx_celebration_likes_celebration ON celebration_likes(celebration_id);
CREATE INDEX idx_celebration_saves_user ON celebration_saves(user_id);
CREATE INDEX idx_celebration_saves_celebration ON celebration_saves(celebration_id);

-- Enable RLS
ALTER TABLE celebration_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for celebration_likes
CREATE POLICY "Users can view all likes" ON celebration_likes
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own likes" ON celebration_likes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for celebration_saves
CREATE POLICY "Users can view own saves" ON celebration_saves
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saves" ON celebration_saves
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Recreate triggers for likes count
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'celebration_likes_count_trigger'
    ) THEN
        CREATE TRIGGER celebration_likes_count_trigger
            AFTER INSERT OR DELETE ON celebration_likes
            FOR EACH ROW EXECUTE FUNCTION update_celebration_likes_count();
    END IF;
END $$;
