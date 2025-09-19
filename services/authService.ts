
import type { User, NotificationPreferences } from '../types';
import { userService } from './userService';
import { initializeDatabase, sql } from './database';

// Session storage keys for browser-side session management
const SESSION_STORAGE_KEY = 'woon_session_token';
const USERS_STORAGE_KEY = 'woon_users';
const SESSION_EMAIL_KEY = 'woon_session_email';

// Initialize database on first import
let dbInitialized = false;
const ensureDbInitialized = async () => {
    if (!dbInitialized && sql) {
        try {
            await initializeDatabase();
            dbInitialized = true;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            // Don't throw - fall back to localStorage
        }
    }
};

// localStorage fallback functions (from original implementation)
interface StoredUser extends User {
    passwordHash: string;
}

const getStoredUsers = (): StoredUser[] => {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        return [];
    }
};

const saveStoredUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const hashPassword = (password: string): string => {
    // Simple hash for localStorage fallback
    return `hashed_${password.split('').reverse().join('')}`;
};

const getUserFromStored = (email: string | null): User | null => {
    if (!email) return null;
    const users = getStoredUsers();
    const storedUser = users.find(u => u.email === email);
    if (!storedUser) return null;

    const { passwordHash, ...user } = storedUser;
    return user;
};

export const authService = {
    signUp: async (name: string, email: string, password: string): Promise<User> => {
        await ensureDbInitialized();
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay

        if (sql && dbInitialized) {
            // Use database
            const user = await userService.createUser(name, email, password);
            const sessionToken = await userService.createSession(user.id);
            localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
            return user;
        } else {
            // Fallback to localStorage
            const users = getStoredUsers();
            if (users.some(u => u.email === email)) {
                throw new Error('An account with this email already exists.');
            }

            const newUser: StoredUser = {
                id: new Date().toISOString(),
                name,
                email,
                passwordHash: hashPassword(password),
                notificationPreferences: {
                    dailySpecialDay: true,
                    communityActivity: true,
                },
                likedCelebrationIds: [],
            };

            users.push(newUser);
            saveStoredUsers(users);
            localStorage.setItem(SESSION_EMAIL_KEY, email);

            const { passwordHash, ...userToReturn } = newUser;
            return userToReturn;
        }
    },

    logIn: async (email: string, password: string): Promise<User> => {
        await ensureDbInitialized();
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay

        if (sql && dbInitialized) {
            // Use database
            const user = await userService.authenticateUser(email, password);
            const sessionToken = await userService.createSession(user.id);
            localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
            return user;
        } else {
            // Fallback to localStorage
            const users = getStoredUsers();
            const storedUser = users.find(u => u.email === email);

            if (!storedUser || storedUser.passwordHash !== hashPassword(password)) {
                throw new Error('Invalid email or password.');
            }

            localStorage.setItem(SESSION_EMAIL_KEY, email);
            const { passwordHash, ...userToReturn } = storedUser;
            return userToReturn;
        }
    },

    logOut: async (): Promise<void> => {
        await new Promise(res => setTimeout(res, 300)); // Simulate network delay

        const sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionToken) {
            await userService.deleteSession(sessionToken);
        }

        localStorage.removeItem(SESSION_STORAGE_KEY);
    },

    checkSession: async (): Promise<User | null> => {
        try {
            await ensureDbInitialized();

            if (sql && dbInitialized) {
                // Use database
                const sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);
                if (!sessionToken) return null;
                return await userService.getUserBySession(sessionToken);
            } else {
                // Fallback to localStorage
                const email = localStorage.getItem(SESSION_EMAIL_KEY);
                return getUserFromStored(email);
            }
        } catch (error) {
            console.error('Error checking session:', error);
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(SESSION_EMAIL_KEY);
            return null;
        }
    },

    updateNotificationPreferences: async (prefs: Partial<NotificationPreferences>): Promise<User> => {
        await ensureDbInitialized();
        await new Promise(res => setTimeout(res, 300)); // Simulate network delay

        const sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionToken) throw new Error("User not authenticated.");

        const currentUser = await userService.getUserBySession(sessionToken);
        if (!currentUser) throw new Error("Invalid session.");

        return await userService.updateNotificationPreferences(currentUser.id, prefs);
    },

    toggleLikeStatus: async (celebrationId: number): Promise<User> => {
        await ensureDbInitialized();
        await new Promise(res => setTimeout(res, 100)); // Simulate network delay

        const sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionToken) throw new Error("User not authenticated.");

        const currentUser = await userService.getUserBySession(sessionToken);
        if (!currentUser) throw new Error("Invalid session.");

        return await userService.toggleLikeStatus(currentUser.id, celebrationId);
    }
};