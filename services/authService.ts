
import type { User, NotificationPreferences } from '../types';
import { userService } from './userService';
import { initializeDatabase } from './database';

// Session storage key for browser-side session management
const SESSION_STORAGE_KEY = 'woon_session_token';

// Initialize database on first import
let dbInitialized = false;
const ensureDbInitialized = async () => {
    if (!dbInitialized) {
        try {
            await initializeDatabase();
            dbInitialized = true;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw new Error('Database initialization failed');
        }
    }
};

export const authService = {
    signUp: async (name: string, email: string, password: string): Promise<User> => {
        await ensureDbInitialized();
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay

        const user = await userService.createUser(name, email, password);
        const sessionToken = await userService.createSession(user.id);

        // Store session token in localStorage for client-side session management
        localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);

        return user;
    },

    logIn: async (email: string, password: string): Promise<User> => {
        await ensureDbInitialized();
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay

        const user = await userService.authenticateUser(email, password);
        const sessionToken = await userService.createSession(user.id);

        // Store session token in localStorage for client-side session management
        localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);

        return user;
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
            const sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);

            if (!sessionToken) {
                return null;
            }

            return await userService.getUserBySession(sessionToken);
        } catch (error) {
            console.error('Error checking session:', error);
            // Clean up invalid session token
            localStorage.removeItem(SESSION_STORAGE_KEY);
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