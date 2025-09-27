-- Supabase Database Migration Script
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. First, let's check if the user_profiles table exists and add missing columns
DO $$
BEGIN
    -- Add missing columns to user_profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'handle') THEN
        ALTER TABLE user_profiles ADD COLUMN handle TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
        ALTER TABLE user_profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'location') THEN
        ALTER TABLE user_profiles ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'streak_days') THEN
        ALTER TABLE user_profiles ADD COLUMN streak_days INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'experience_points') THEN
        ALTER TABLE user_profiles ADD COLUMN experience_points INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'level') THEN
        ALTER TABLE user_profiles ADD COLUMN level INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'notification_preferences') THEN
        ALTER TABLE user_profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"dailySpecialDay": true, "communityActivity": true, "eventReminders": true, "followNotifications": true}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'created_at') THEN
        ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 2. Create missing tables
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS celebration_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    celebration_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, celebration_id)
);

CREATE TABLE IF NOT EXISTS celebration_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    celebration_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, celebration_id)
);

CREATE TABLE IF NOT EXISTS event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    rsvp_status TEXT DEFAULT 'attending',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, event_id)
);

CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, followed_id),
    CHECK (follower_id != followed_id)
);

-- 3. Insert some default achievements
INSERT INTO achievements (name, description, icon) VALUES
    ('Welcome', 'Created your first account', '🎉'),
    ('First Celebration', 'Shared your first celebration', '✨'),
    ('Social Butterfly', 'Connected with 5 neighbors', '🦋'),
    ('Week Streak', 'Celebrated for 7 days in a row', '🔥'),
    ('Event Host', 'Hosted your first community event', '🎪')
ON CONFLICT DO NOTHING;

-- 4. Create or replace the trigger function for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_display_name TEXT;
    generated_handle TEXT;
BEGIN
    -- Get the display name from auth metadata
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Generate a unique handle
    generated_handle := lower(regexp_replace(user_display_name, '[^a-zA-Z0-9]', '', 'g'));
    generated_handle := generated_handle || substring(md5(random()::text), 1, 4);

    -- Insert the user profile
    INSERT INTO public.user_profiles (
        id,
        email,
        name,
        handle,
        avatar_url,
        streak_days,
        experience_points,
        level,
        notification_preferences,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_display_name,
        generated_handle,
        NULL,
        1,
        0,
        1,
        '{"dailySpecialDay": true, "communityActivity": true, "eventReminders": true, "followNotifications": true}'::jsonb,
        now(),
        now()
    );

    -- Give welcome achievement
    INSERT INTO public.user_achievements (user_id, achievement_id)
    SELECT NEW.id, id FROM public.achievements WHERE name = 'Welcome'
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Create updated_at trigger for user_profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (drop existing ones first to avoid conflicts)
-- User profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view all profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Achievements policies
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- User achievements policies
DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can earn achievements" ON public.user_achievements;

CREATE POLICY "Anyone can view user achievements" ON public.user_achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can earn achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Celebration interactions policies
DROP POLICY IF EXISTS "Users manage own celebration likes" ON public.celebration_likes;
CREATE POLICY "Users manage own celebration likes" ON public.celebration_likes
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own celebration saves" ON public.celebration_saves;
CREATE POLICY "Users manage own celebration saves" ON public.celebration_saves
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own event RSVPs" ON public.event_rsvps;
CREATE POLICY "Users manage own event RSVPs" ON public.event_rsvps
    FOR ALL USING (auth.uid() = user_id);

-- User follows policies
DROP POLICY IF EXISTS "Users manage own follows" ON public.user_follows;
CREATE POLICY "Users manage own follows" ON public.user_follows
    FOR ALL USING (auth.uid() = follower_id OR auth.uid() = followed_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database migration completed successfully! ✅';
    RAISE NOTICE 'You can now test user registration and authentication.';
END $$;