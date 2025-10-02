/*
  # Fix Migration 7 Error
  
  Migration 7 created a view called 'users' but services need to INSERT into tables.
  This migration fixes that by:
  1. Dropping the problematic view
  2. Ensuring all required fields exist in user_profiles
  3. Adding any missing functionality
*/

-- 1. Drop the problematic users view
DROP VIEW IF EXISTS users;

-- 2. Ensure all required fields exist in user_profiles (in case they weren't added)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- 3. Ensure celebration location fields exist
ALTER TABLE celebrations 
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;

-- 4. Create function to update follower/following counts (if not exists)
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment following count for follower
        UPDATE user_profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        -- Increment followers count for followed user
        UPDATE user_profiles 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.followed_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement following count for follower
        UPDATE user_profiles 
        SET following_count = following_count - 1 
        WHERE id = OLD.follower_id;
        
        -- Decrement followers count for followed user
        UPDATE user_profiles 
        SET followers_count = followers_count - 1 
        WHERE id = OLD.followed_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically update follow counts (if not exists)
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON user_follows;
CREATE TRIGGER update_follow_counts_trigger
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 6. Create function to sync celebration location data (if not exists)
CREATE OR REPLACE FUNCTION sync_celebration_location()
RETURNS TRIGGER AS $$
BEGIN
    -- If location_lng and location_lat are provided, update the location field
    IF NEW.location_lng IS NOT NULL AND NEW.location_lat IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to sync celebration location data (if not exists)
DROP TRIGGER IF EXISTS sync_celebration_location_trigger ON celebrations;
CREATE TRIGGER sync_celebration_location_trigger
    BEFORE INSERT OR UPDATE ON celebrations
    FOR EACH ROW EXECUTE FUNCTION sync_celebration_location();

-- 8. Create indexes for better performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_bio ON user_profiles(bio);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_following_count ON user_profiles(following_count);
CREATE INDEX IF NOT EXISTS idx_user_profiles_followers_count ON user_profiles(followers_count);
CREATE INDEX IF NOT EXISTS idx_celebrations_location_coords ON celebrations(location_lng, location_lat);

-- 9. Update existing user profiles to have default values
UPDATE user_profiles 
SET 
    bio = COALESCE(bio, ''),
    subscription_tier = COALESCE(subscription_tier, 'free'),
    following_count = COALESCE(following_count, 0),
    followers_count = COALESCE(followers_count, 0)
WHERE bio IS NULL OR subscription_tier IS NULL OR following_count IS NULL OR followers_count IS NULL;

-- 10. Add comments for documentation
COMMENT ON COLUMN user_profiles.bio IS 'User biography/description';
COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription level (free, premium, etc.)';
COMMENT ON COLUMN user_profiles.following_count IS 'Number of users this user is following';
COMMENT ON COLUMN user_profiles.followers_count IS 'Number of users following this user';
COMMENT ON COLUMN celebrations.location_lng IS 'Longitude coordinate for celebration location';
COMMENT ON COLUMN celebrations.location_lat IS 'Latitude coordinate for celebration location';
