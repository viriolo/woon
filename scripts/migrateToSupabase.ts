import { supabase } from '../services/supabaseClient';

/**
 * Migration script to move existing localStorage data to Supabase
 * Run this once after setting up Supabase
 */

interface LocalStorageUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  handle?: string;
  notificationPreferences: any;
  likedCelebrationIds: number[];
  savedCelebrationIds: number[];
  rsvpedEventIds: string[];
  followingUserIds: string[];
  streakDays: number;
  experiencePoints: number;
  achievements: any[];
  level: number;
}

interface LocalStorageCelebration {
  id: number;
  authorId: string;
  author: string;
  title: string;
  description: string;
  imageUrl: string;
  likes: number;
  commentCount: number;
  position: { lng: number; lat: number };
}

export const migrateToSupabase = async () => {
  console.log('🚀 Starting migration to Supabase...');

  try {
    // 1. Migrate users
    const usersJson = localStorage.getItem('woon_users');
    if (usersJson) {
      const users: LocalStorageUser[] = JSON.parse(usersJson);
      console.log(`📥 Migrating ${users.length} users...`);

      for (const user of users) {
        // Create auth user first (you'll need to handle this manually or use Supabase admin API)
        console.log(`Creating user: ${user.email}`);

        // Insert user profile
        const { error } = await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          handle: user.handle,
          avatar_url: user.avatarUrl,
          streak_days: user.streakDays,
          experience_points: user.experiencePoints,
          level: user.level,
          notification_preferences: user.notificationPreferences
        });

        if (error) {
          console.error(`❌ Error migrating user ${user.email}:`, error);
        } else {
          console.log(`✅ Migrated user: ${user.email}`);
        }
      }
    }

    // 2. Migrate celebrations (from constants and localStorage)
    const celebrationsJson = localStorage.getItem('woon_celebrations');
    const celebrations: LocalStorageCelebration[] = celebrationsJson
      ? JSON.parse(celebrationsJson)
      : [];

    // Add mock celebrations from constants
    const mockCelebrations = [
      { id: 1, authorId: "user_mock_1", author: "Maria S.", title: "My watercolor station", description: "Setting up my paints for a fun afternoon!", imageUrl: "https://picsum.photos/seed/woon1/400/300", likes: 142, commentCount: 3, position: { lng: -122.41, lat: 37.78 } },
      // ... add other mock celebrations
    ];

    const allCelebrations = [...mockCelebrations, ...celebrations];

    console.log(`📥 Migrating ${allCelebrations.length} celebrations...`);

    for (const celebration of allCelebrations) {
      const { error } = await supabase.from('celebrations').upsert({
        id: celebration.id,
        user_id: celebration.authorId,
        title: celebration.title,
        description: celebration.description,
        image_url: celebration.imageUrl,
        location: `POINT(${celebration.position.lng} ${celebration.position.lat})`,
        likes_count: celebration.likes,
        comments_count: celebration.commentCount
      });

      if (error) {
        console.error(`❌ Error migrating celebration ${celebration.id}:`, error);
      } else {
        console.log(`✅ Migrated celebration: ${celebration.title}`);
      }
    }

    // 3. Migrate special days
    const specialDays = [
      {
        title: "World Creativity Day",
        description: "A day to celebrate and encourage creative thinking and innovation in all aspects of human expression.",
        date: "2024-04-21",
        category: "Global Observance"
      },
      {
        title: "Earth Day",
        description: "An annual event to demonstrate support for environmental protection, with events coordinated globally.",
        date: "2024-04-22",
        category: "Environmental"
      }
    ];

    console.log(`📥 Migrating ${specialDays.length} special days...`);

    const { error: specialDaysError } = await supabase
      .from('special_days')
      .upsert(specialDays);

    if (specialDaysError) {
      console.error('❌ Error migrating special days:', specialDaysError);
    } else {
      console.log('✅ Migrated special days');
    }

    // 4. Create achievements
    const achievements = [
      { id: 'first_login', name: 'First Steps', description: 'Signed in to begin your celebration journey.' },
      { id: 'streak_7', name: 'One Week Wonder', description: 'Celebrated seven days in a row.' },
      { id: 'event_host', name: 'Community Host', description: 'Published your first community event.' }
    ];

    const { error: achievementsError } = await supabase
      .from('achievements')
      .upsert(achievements);

    if (achievementsError) {
      console.error('❌ Error migrating achievements:', achievementsError);
    } else {
      console.log('✅ Migrated achievements');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('1. Update your app to use Supabase services');
    console.log('2. Test authentication flow');
    console.log('3. Verify data integrity');
    console.log('4. Set up Row Level Security policies');

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
};

// Uncomment to run migration
// migrateToSupabase();