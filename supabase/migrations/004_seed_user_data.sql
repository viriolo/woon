-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
('Welcome to Woon', 'Joined the Woon community', '👋', 'signup', 1),
('First Celebration', 'Shared your first celebration', '🎉', 'celebration_count', 1),
('Social Butterfly', 'Liked 10 celebrations', '🦋', 'like_count', 10),
('Event Planner', 'Created your first event', '📅', 'event_count', 1),
('Community Builder', 'Followed 5 people', '🏘️', 'follow_count', 5),
('Streak Champion', 'Maintained a 7-day streak', '🔥', 'streak_days', 7),
('Experience Seeker', 'Earned 500 experience points', '⭐', 'experience_points', 500),
('Level Up', 'Reached level 5', '📈', 'level', 5),
('Popular Creator', 'Received 50 likes on celebrations', '💖', 'received_likes', 50),
('Event Enthusiast', 'RSVP\'d to 10 events', '🎪', 'rsvp_count', 10);

-- Create function to calculate user level based on experience points
CREATE OR REPLACE FUNCTION calculate_user_level(experience_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    CASE
        WHEN experience_points >= 2000 THEN RETURN 6;
        WHEN experience_points >= 1400 THEN RETURN 5;
        WHEN experience_points >= 900 THEN RETURN 4;
        WHEN experience_points >= 500 THEN RETURN 3;
        WHEN experience_points >= 200 THEN RETURN 2;
        ELSE RETURN 1;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid UUID)
RETURNS void AS $$
DECLARE
    user_record RECORD;
    achievement_record RECORD;
    celebration_count INTEGER;
    like_count INTEGER;
    follow_count INTEGER;
    event_count INTEGER;
    rsvp_count INTEGER;
    received_likes INTEGER;
BEGIN
    -- Get user data
    SELECT * INTO user_record FROM user_profiles WHERE id = user_uuid;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Count user activities
    SELECT COUNT(*) INTO celebration_count
    FROM content WHERE author_id = user_uuid::text AND type = 'celebration';

    SELECT COUNT(*) INTO like_count
    FROM celebration_likes WHERE user_id = user_uuid;

    SELECT COUNT(*) INTO follow_count
    FROM user_follows WHERE follower_id = user_uuid;

    SELECT COUNT(*) INTO event_count
    FROM events WHERE created_by = user_uuid;

    SELECT COUNT(*) INTO rsvp_count
    FROM event_rsvps WHERE user_id = user_uuid;

    SELECT COUNT(*) INTO received_likes
    FROM celebration_likes cl
    JOIN content c ON c.id::text = cl.celebration_id::text
    WHERE c.author_id = user_uuid::text;

    -- Check and award achievements
    FOR achievement_record IN
        SELECT * FROM achievements
        WHERE id NOT IN (
            SELECT achievement_id FROM user_achievements WHERE user_id = user_uuid
        )
    LOOP
        CASE achievement_record.requirement_type
            WHEN 'signup' THEN
                INSERT INTO user_achievements (user_id, achievement_id)
                VALUES (user_uuid, achievement_record.id);

            WHEN 'celebration_count' THEN
                IF celebration_count >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'like_count' THEN
                IF like_count >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'follow_count' THEN
                IF follow_count >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'event_count' THEN
                IF event_count >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'streak_days' THEN
                IF user_record.streak_days >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'experience_points' THEN
                IF user_record.experience_points >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'level' THEN
                IF user_record.level >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'received_likes' THEN
                IF received_likes >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;

            WHEN 'rsvp_count' THEN
                IF rsvp_count >= achievement_record.requirement_value THEN
                    INSERT INTO user_achievements (user_id, achievement_id)
                    VALUES (user_uuid, achievement_record.id);
                END IF;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to add experience points and update level
CREATE OR REPLACE FUNCTION add_experience_points(user_uuid UUID, points INTEGER)
RETURNS void AS $$
DECLARE
    new_experience INTEGER;
    new_level INTEGER;
BEGIN
    UPDATE user_profiles
    SET
        experience_points = experience_points + points,
        updated_at = NOW()
    WHERE id = user_uuid;

    -- Get updated experience points
    SELECT experience_points INTO new_experience
    FROM user_profiles WHERE id = user_uuid;

    -- Calculate new level
    new_level := calculate_user_level(new_experience);

    -- Update level if it changed
    UPDATE user_profiles
    SET level = new_level
    WHERE id = user_uuid AND level != new_level;

    -- Check for new achievements
    PERFORM check_and_award_achievements(user_uuid);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically award experience points
CREATE OR REPLACE FUNCTION award_experience_for_celebration()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.type = 'celebration' AND NEW.status = 'published' THEN
        PERFORM add_experience_points(NEW.author_id::uuid, 75);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION award_experience_for_like()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM add_experience_points(NEW.user_id, 5);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION award_experience_for_follow()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM add_experience_points(NEW.follower_id, 10);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION award_experience_for_event()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM add_experience_points(NEW.created_by, 50);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers
CREATE TRIGGER celebration_experience_trigger
    AFTER INSERT ON content
    FOR EACH ROW EXECUTE FUNCTION award_experience_for_celebration();

CREATE TRIGGER like_experience_trigger
    AFTER INSERT ON celebration_likes
    FOR EACH ROW EXECUTE FUNCTION award_experience_for_like();

CREATE TRIGGER follow_experience_trigger
    AFTER INSERT ON user_follows
    FOR EACH ROW EXECUTE FUNCTION award_experience_for_follow();

CREATE TRIGGER event_experience_trigger
    AFTER INSERT ON events
    FOR EACH ROW EXECUTE FUNCTION award_experience_for_event();