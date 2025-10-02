/*
  # Fix Schema Mismatches and Missing Fields
  
  This migration addresses critical mismatches between the database schema
  and the service implementations:
  
  1. Fix table name mismatch (users vs user_profiles)
  2. Add missing user profile fields
  3. Fix celebration location schema
  4. Add missing indexes and constraints
*/

-- 1. Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- 2. Create a view to alias user_profiles as users for backward compatibility
CREATE OR REPLACE VIEW users AS 
SELECT 
    id,
    email,
    name,
    handle,
    avatar_url,
    bio,
    location,
    subscription_tier,
    following_count,
    followers_count,
    streak_days,
    experience_points,
    level,
    notification_preferences,
    created_at,
    updated_at
FROM user_profiles;

-- 3. Create RLS policies for the users view
CREATE POLICY "Users can view all profiles via users view" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile via users view" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 4. Fix celebration location schema - add separate lat/lng columns
ALTER TABLE celebrations 
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;

-- 5. Create function to update follower/following counts
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

-- 6. Create trigger to automatically update follow counts
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON user_follows;
CREATE TRIGGER update_follow_counts_trigger
    AFTER INSERT OR DELETE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 7. Create function to get user with achievements
CREATE OR REPLACE FUNCTION get_user_with_achievements(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    handle TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    subscription_tier TEXT,
    following_count INTEGER,
    followers_count INTEGER,
    streak_days INTEGER,
    experience_points INTEGER,
    level INTEGER,
    notification_preferences JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    achievements JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.name,
        up.handle,
        up.avatar_url,
        up.bio,
        up.location,
        up.subscription_tier,
        up.following_count,
        up.followers_count,
        up.streak_days,
        up.experience_points,
        up.level,
        up.notification_preferences,
        up.created_at,
        up.updated_at,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', a.id,
                    'name', a.name,
                    'description', a.description,
                    'icon', a.icon,
                    'earnedAt', ua.earned_at
                )
            ) FILTER (WHERE a.id IS NOT NULL),
            '[]'::json
        ) as achievements
    FROM user_profiles up
    LEFT JOIN user_achievements ua ON up.id = ua.user_id
    LEFT JOIN achievements a ON ua.achievement_id = a.id
    WHERE up.id = user_uuid
    GROUP BY up.id, up.email, up.name, up.handle, up.avatar_url, up.bio, 
             up.location, up.subscription_tier, up.following_count, up.followers_count,
             up.streak_days, up.experience_points, up.level, up.notification_preferences,
             up.created_at, up.updated_at;
END;
$$ LANGUAGE plpgsql;

-- 8. Create indexes for better performance
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

-- 10. Create function to sync celebration location data
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

-- 11. Create trigger to sync celebration location data
DROP TRIGGER IF EXISTS sync_celebration_location_trigger ON celebrations;
CREATE TRIGGER sync_celebration_location_trigger
    BEFORE INSERT OR UPDATE ON celebrations
    FOR EACH ROW EXECUTE FUNCTION sync_celebration_location();

-- 12. Grant necessary permissions
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 13. Create a function to get user's liked and saved celebrations
CREATE OR REPLACE FUNCTION get_user_celebration_data(user_uuid UUID)
RETURNS TABLE (
    liked_celebration_ids BIGINT[],
    saved_celebration_ids BIGINT[],
    rsvped_event_ids UUID[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            array_agg(DISTINCT cl.celebration_id) FILTER (WHERE cl.celebration_id IS NOT NULL),
            ARRAY[]::BIGINT[]
        ) as liked_celebration_ids,
        COALESCE(
            array_agg(DISTINCT cs.celebration_id) FILTER (WHERE cs.celebration_id IS NOT NULL),
            ARRAY[]::BIGINT[]
        ) as saved_celebration_ids,
        COALESCE(
            array_agg(DISTINCT er.event_id) FILTER (WHERE er.event_id IS NOT NULL),
            ARRAY[]::UUID[]
        ) as rsvped_event_ids
    FROM user_profiles up
    LEFT JOIN celebration_likes cl ON up.id = cl.user_id
    LEFT JOIN celebration_saves cs ON up.id = cs.user_id
    LEFT JOIN event_rsvps er ON up.id = er.user_id
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 14. Create a function to get user's following data
CREATE OR REPLACE FUNCTION get_user_following_data(user_uuid UUID)
RETURNS TABLE (
    following_user_ids UUID[],
    follower_user_ids UUID[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            array_agg(DISTINCT uf1.followed_id) FILTER (WHERE uf1.followed_id IS NOT NULL),
            ARRAY[]::UUID[]
        ) as following_user_ids,
        COALESCE(
            array_agg(DISTINCT uf2.follower_id) FILTER (WHERE uf2.follower_id IS NOT NULL),
            ARRAY[]::UUID[]
        ) as follower_user_ids
    FROM user_profiles up
    LEFT JOIN user_follows uf1 ON up.id = uf1.follower_id
    LEFT JOIN user_follows uf2 ON up.id = uf2.followed_id
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 15. Add comments for documentation
COMMENT ON COLUMN user_profiles.bio IS 'User biography/description';
COMMENT ON COLUMN user_profiles.subscription_tier IS 'User subscription level (free, premium, etc.)';
COMMENT ON COLUMN user_profiles.following_count IS 'Number of users this user is following';
COMMENT ON COLUMN user_profiles.followers_count IS 'Number of users following this user';
COMMENT ON COLUMN celebrations.location_lng IS 'Longitude coordinate for celebration location';
COMMENT ON COLUMN celebrations.location_lat IS 'Latitude coordinate for celebration location';
COMMENT ON VIEW users IS 'Backward compatibility view for user_profiles table';

-- 16. Create a comprehensive user data function for the auth service
CREATE OR REPLACE FUNCTION get_complete_user_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_data JSONB;
    achievement_data JSONB;
    celebration_data JSONB;
    following_data JSONB;
BEGIN
    -- Get basic user data
    SELECT to_jsonb(up.*) INTO user_data
    FROM user_profiles up
    WHERE up.id = user_uuid;
    
    -- Get achievement data
    SELECT json_agg(
        json_build_object(
            'id', a.id,
            'name', a.name,
            'description', a.description,
            'icon', a.icon,
            'earnedAt', ua.earned_at
        )
    ) INTO achievement_data
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = user_uuid;
    
    -- Get celebration data
    SELECT json_build_object(
        'likedCelebrationIds', COALESCE(
            array_agg(DISTINCT cl.celebration_id) FILTER (WHERE cl.celebration_id IS NOT NULL),
            ARRAY[]::BIGINT[]
        ),
        'savedCelebrationIds', COALESCE(
            array_agg(DISTINCT cs.celebration_id) FILTER (WHERE cs.celebration_id IS NOT NULL),
            ARRAY[]::BIGINT[]
        ),
        'rsvpedEventIds', COALESCE(
            array_agg(DISTINCT er.event_id) FILTER (WHERE er.event_id IS NOT NULL),
            ARRAY[]::UUID[]
        )
    ) INTO celebration_data
    FROM user_profiles up
    LEFT JOIN celebration_likes cl ON up.id = cl.user_id
    LEFT JOIN celebration_saves cs ON up.id = cs.user_id
    LEFT JOIN event_rsvps er ON up.id = er.user_id
    WHERE up.id = user_uuid;
    
    -- Get following data
    SELECT json_build_object(
        'followingUserIds', COALESCE(
            array_agg(DISTINCT uf1.followed_id) FILTER (WHERE uf1.followed_id IS NOT NULL),
            ARRAY[]::UUID[]
        ),
        'followerUserIds', COALESCE(
            array_agg(DISTINCT uf2.follower_id) FILTER (WHERE uf2.follower_id IS NOT NULL),
            ARRAY[]::UUID[]
        )
    ) INTO following_data
    FROM user_profiles up
    LEFT JOIN user_follows uf1 ON up.id = uf1.follower_id
    LEFT JOIN user_follows uf2 ON up.id = uf2.followed_id
    WHERE up.id = user_uuid;
    
    -- Combine all data
    user_data := user_data || jsonb_build_object(
        'achievements', COALESCE(achievement_data, '[]'::jsonb),
        'likedCelebrationIds', celebration_data->'likedCelebrationIds',
        'savedCelebrationIds', celebration_data->'savedCelebrationIds',
        'rsvpedEventIds', celebration_data->'rsvpedEventIds',
        'followingUserIds', following_data->'followingUserIds',
        'followerUserIds', following_data->'followerUserIds'
    );
    
    RETURN user_data;
END;
$$ LANGUAGE plpgsql;
