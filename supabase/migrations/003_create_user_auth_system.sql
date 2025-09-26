-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    handle TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    streak_days INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    notification_preferences JSONB DEFAULT '{
        "dailySpecialDay": true,
        "communityActivity": true,
        "eventReminders": true,
        "followNotifications": true
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    requirement_type TEXT, -- 'celebration_count', 'streak_days', 'experience_points', etc.
    requirement_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE user_achievements (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- Create user_follows table for following system
CREATE TABLE user_follows (
    follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id != followed_id)
);

-- Create celebration_likes table
CREATE TABLE celebration_likes (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    celebration_id UUID REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, celebration_id)
);

-- Create celebration_saves table
CREATE TABLE celebration_saves (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    celebration_id UUID REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, celebration_id)
);

-- Create events table (separate from CMS content)
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    location TEXT,
    location_coords JSONB, -- {lat, lng}
    max_attendees INTEGER,
    created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_rsvps table
CREATE TABLE event_rsvps (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    rsvp_status TEXT DEFAULT 'attending', -- 'attending', 'maybe', 'not_attending'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_handle ON user_profiles(handle);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_followed ON user_follows(followed_id);
CREATE INDEX idx_celebration_likes_user ON celebration_likes(user_id);
CREATE INDEX idx_celebration_likes_celebration ON celebration_likes(celebration_id);
CREATE INDEX idx_celebration_saves_user ON celebration_saves(user_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_updated_at_events()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_user_profiles();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_events();

-- Create function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO user_profiles (id, email, name, handle)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
        LOWER(REGEXP_REPLACE(
            COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
            '[^a-zA-Z0-9]', '', 'g'
        )) || EXTRACT(epoch FROM NOW())::integer
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebration_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles: users can read all, but only update their own
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- User follows: users can manage their own follows
CREATE POLICY "Users can view all follows" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON user_follows
    FOR ALL USING (auth.uid() = follower_id);

-- Celebration likes: users can manage their own likes
CREATE POLICY "Users can view all likes" ON celebration_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON celebration_likes
    FOR ALL USING (auth.uid() = user_id);

-- Celebration saves: users can manage their own saves
CREATE POLICY "Users can view own saves" ON celebration_saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saves" ON celebration_saves
    FOR ALL USING (auth.uid() = user_id);

-- Events: users can view all, create own, update own
CREATE POLICY "Users can view all events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own events" ON events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own events" ON events
    FOR DELETE USING (auth.uid() = created_by);

-- Event RSVPs: users can manage their own RSVPs
CREATE POLICY "Users can view event RSVPs" ON event_rsvps
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own RSVPs" ON event_rsvps
    FOR ALL USING (auth.uid() = user_id);

-- User achievements: users can view all
CREATE POLICY "Users can view achievements" ON user_achievements
    FOR SELECT USING (true);