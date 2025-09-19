import bcrypt from 'bcryptjs';
import { sql } from './database';
import type { User, NotificationPreferences } from '../types';

// Database row interface
interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  notification_preferences: NotificationPreferences;
  liked_celebration_ids: number[];
  created_at: string;
  updated_at: string;
}

// Convert database row to User type
const rowToUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  notificationPreferences: row.notification_preferences,
  likedCelebrationIds: row.liked_celebration_ids || []
});

// Generate session token
const generateSessionToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const userService = {
  // Create a new user
  createUser: async (name: string, email: string, password: string): Promise<User> => {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      throw new Error('An account with this email already exists.');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email, notification_preferences, liked_celebration_ids
    `;

    if (result.length === 0) {
      throw new Error('Failed to create user');
    }

    return rowToUser(result[0] as UserRow);
  },

  // Authenticate user
  authenticateUser: async (email: string, password: string): Promise<User> => {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (result.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const user = result[0] as UserRow;
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    return rowToUser(user);
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User | null> => {
    const result = await sql`
      SELECT id, name, email, notification_preferences, liked_celebration_ids
      FROM users WHERE id = ${userId}
    `;

    if (result.length === 0) {
      return null;
    }

    return rowToUser(result[0] as UserRow);
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<User | null> => {
    const result = await sql`
      SELECT id, name, email, notification_preferences, liked_celebration_ids
      FROM users WHERE email = ${email}
    `;

    if (result.length === 0) {
      return null;
    }

    return rowToUser(result[0] as UserRow);
  },

  // Update notification preferences
  updateNotificationPreferences: async (userId: string, prefs: Partial<NotificationPreferences>): Promise<User> => {
    // Get current preferences
    const currentUser = await userService.getUserById(userId);
    if (!currentUser) {
      throw new Error('User not found.');
    }

    // Merge preferences
    const updatedPrefs = {
      ...currentUser.notificationPreferences,
      ...prefs
    };

    // Update in database
    const result = await sql`
      UPDATE users
      SET notification_preferences = ${JSON.stringify(updatedPrefs)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, email, notification_preferences, liked_celebration_ids
    `;

    if (result.length === 0) {
      throw new Error('Failed to update preferences');
    }

    return rowToUser(result[0] as UserRow);
  },

  // Toggle like status for a celebration
  toggleLikeStatus: async (userId: string, celebrationId: number): Promise<User> => {
    const currentUser = await userService.getUserById(userId);
    if (!currentUser) {
      throw new Error('User not found.');
    }

    const isLiked = currentUser.likedCelebrationIds.includes(celebrationId);
    let updatedLikes: number[];

    if (isLiked) {
      updatedLikes = currentUser.likedCelebrationIds.filter(id => id !== celebrationId);
    } else {
      updatedLikes = [...currentUser.likedCelebrationIds, celebrationId];
    }

    const result = await sql`
      UPDATE users
      SET liked_celebration_ids = ${updatedLikes}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, email, notification_preferences, liked_celebration_ids
    `;

    if (result.length === 0) {
      throw new Error('Failed to update like status');
    }

    return rowToUser(result[0] as UserRow);
  },

  // Session management
  createSession: async (userId: string): Promise<string> => {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()})
    `;

    return sessionToken;
  },

  // Get user by session token
  getUserBySession: async (sessionToken: string): Promise<User | null> => {
    const result = await sql`
      SELECT u.id, u.name, u.email, u.notification_preferences, u.liked_celebration_ids
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (result.length === 0) {
      return null;
    }

    return rowToUser(result[0] as UserRow);
  },

  // Delete session (logout)
  deleteSession: async (sessionToken: string): Promise<void> => {
    await sql`
      DELETE FROM user_sessions WHERE session_token = ${sessionToken}
    `;
  },

  // Clean up expired sessions
  cleanupExpiredSessions: async (): Promise<void> => {
    await sql`
      DELETE FROM user_sessions WHERE expires_at <= NOW()
    `;
  }
};