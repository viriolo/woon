import type { User, NotificationPreferences } from '../types';

// This service now uses localStorage to simulate a user database, making it functional without a backend.

const USERS_STORAGE_KEY = 'woon_users';
const SESSION_STORAGE_KEY = 'woon_session_email';

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
    // In a real app, use a strong hashing algorithm like bcrypt.
    // This is a simple simulation for demonstration purposes.
    return `hashed_${password.split('').reverse().join('')}`;
};

const getUserFromStored = (email: string | null): User | null => {
    if (!email) return null;
    const users = getStoredUsers();
    const storedUser = users.find(u => u.email === email);
    if (!storedUser) return null;
    
    const { passwordHash, ...user } = storedUser;
    return user;
}

export const authService = {
    signUp: async (name: string, email: string, password: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay
        const users = getStoredUsers();
        if (users.some(u => u.email === email)) {
            throw new Error('An account with this email already exists.');
        }

        const newUser: StoredUser = {
            id: new Date().toISOString(),
            name,
            email,
            passwordHash: hashPassword(password),
            avatarUrl: undefined,
            notificationPreferences: {
                dailySpecialDay: true,
                communityActivity: true,
            },
            likedCelebrationIds: [],
        };
        
        users.push(newUser);
        saveStoredUsers(users);
        localStorage.setItem(SESSION_STORAGE_KEY, email);

        const { passwordHash, ...userToReturn } = newUser;
        return userToReturn;
    },

    logIn: async (email: string, password: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay
        const users = getStoredUsers();
        const storedUser = users.find(u => u.email === email);

        if (!storedUser || storedUser.passwordHash !== hashPassword(password)) {
            throw new Error('Invalid email or password.');
        }
        
        localStorage.setItem(SESSION_STORAGE_KEY, email);
        const { passwordHash, ...userToReturn } = storedUser;
        return userToReturn;
    },

    socialLogIn: async (provider: 'google' | 'facebook'): Promise<User> => {
        await new Promise(res => setTimeout(res, 700)); // Simulate network delay
        const users = getStoredUsers();
        
        const mockEmail = `social_user_${provider}@example.com`;
        const mockName = provider === 'google' ? 'Google User' : 'Facebook User';

        let storedUser = users.find(u => u.email === mockEmail);

        if (!storedUser) {
            // If user doesn't exist, create a new one (first-time social login)
            const newUser: StoredUser = {
                id: new Date().toISOString(),
                name: mockName,
                email: mockEmail,
                passwordHash: hashPassword('social_login_dummy_password'),
                avatarUrl: undefined,
                notificationPreferences: {
                    dailySpecialDay: true,
                    communityActivity: true,
                },
                likedCelebrationIds: [],
            };
            users.push(newUser);
            saveStoredUsers(users);
            storedUser = newUser;
        }

        localStorage.setItem(SESSION_STORAGE_KEY, storedUser.email);
        const { passwordHash, ...userToReturn } = storedUser;
        return userToReturn;
    },

    logOut: async (): Promise<void> => {
        await new Promise(res => setTimeout(res, 300)); // Simulate network delay
        localStorage.removeItem(SESSION_STORAGE_KEY);
    },

    checkSession: (): User | null => {
        // This is now a synchronous check against localStorage
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        return getUserFromStored(email);
    },

    updateNotificationPreferences: async (prefs: Partial<NotificationPreferences>): Promise<User> => {
        await new Promise(res => setTimeout(res, 300)); // Simulate network delay
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex === -1) throw new Error("User not found.");

        users[userIndex].notificationPreferences = {
            ...users[userIndex].notificationPreferences,
            ...prefs
        };
        saveStoredUsers(users);
        
        const { passwordHash, ...updatedUser } = users[userIndex];
        return updatedUser;
    },
    
    toggleLikeStatus: async (celebrationId: number): Promise<User> => {
        await new Promise(res => setTimeout(res, 100)); // Simulate network delay
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex === -1) throw new Error("User not found.");

        const user = users[userIndex];
        const isLiked = user.likedCelebrationIds.includes(celebrationId);

        if (isLiked) {
            user.likedCelebrationIds = user.likedCelebrationIds.filter(id => id !== celebrationId);
        } else {
            user.likedCelebrationIds.push(celebrationId);
        }
        
        saveStoredUsers(users);
        
        const { passwordHash, ...updatedUser } = user;
        return updatedUser;
    },

    updateAvatar: async (base64Image: string): Promise<User> => {
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay
        const email = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!email) throw new Error("User not authenticated.");

        const users = getStoredUsers();
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex === -1) throw new Error("User not found.");

        users[userIndex].avatarUrl = base64Image;
        saveStoredUsers(users);
        
        const { passwordHash, ...updatedUser } = users[userIndex];
        return updatedUser;
    }
};