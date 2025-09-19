import { neon } from '@neondatabase/serverless';

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
}

// Create the database connection
export const sql = neon(DATABASE_URL);

// Database initialization - create tables if they don't exist
export const initializeDatabase = async () => {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        notification_preferences JSONB DEFAULT '{"dailySpecialDay": true, "communityActivity": true}',
        liked_celebration_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create celebrations table
    await sql`
      CREATE TABLE IF NOT EXISTS celebrations (
        id SERIAL PRIMARY KEY,
        author VARCHAR(255) NOT NULL,
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        likes INTEGER DEFAULT 0,
        position_lng DECIMAL(10, 8),
        position_lat DECIMAL(10, 8),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME,
        location VARCHAR(255),
        description TEXT,
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        author_name VARCHAR(255) NOT NULL,
        location_lng DECIMAL(10, 8),
        location_lat DECIMAL(10, 8),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create sessions table for user sessions
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_celebrations_author_id ON celebrations(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_author_id ON events(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};