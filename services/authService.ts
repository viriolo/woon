import type { User, NotificationPreferences } from '../types';

// In a real app, this would be a secure backend service.
// For this demo, we simulate it with localStorage.

const USERS_KEY = 'woon_users';
const CURRENT_USER_KEY = 'woon_currentUser';

// Internal type that includes password, should not be exposed to the app
type StoredUser = User & { password: string };

// Helper to get users from localStorage
const getUsers = (): StoredUser[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save users to localStorage
const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Function to strip password before returning user object
const toUser = (storedUser: StoredUser): User => {
    const { password, ...user } = storedUser;
    return user;
};

export const authService = {
    signUp: (name: string, email: string, password: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate network delay
                if (!password) {
                    return reject(new Error('Password is required.'));
                }
                const users = getUsers();
                const existingUser = users.find(u => u.email === email);
                if (existingUser) {
                    return reject(new Error('Email already in use.'));
                }
                const newUser: StoredUser = {
                    id: Date.now().toString(),
                    name,
                    email,
                    password, // In a real app, this would be hashed
                    notificationPreferences: {
                        dailySpecialDay: true,
                        communityActivity: true,
                    },
                };
                const updatedUsers = [...users, newUser];
                saveUsers(updatedUsers);
                
                const publicUser = toUser(newUser);
                // Automatically log in the new user
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));
                resolve(publicUser);
            }, 500);
        });
    },

    logIn: (email: string, password: string): Promise<User> => {
        return new Promise((resolve, reject) => {
             setTimeout(() => { // Simulate network delay
                const users = getUsers();
                const user = users.find(u => u.email === email);
                if (!user || user.password !== password) { // In a real app, compare hashed passwords
                    return reject(new Error('Invalid email or password.'));
                }
                const publicUser = toUser(user);
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));
                resolve(publicUser);
            }, 500);
        });
    },

    logOut: (): void => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: (): User | null => {
        const userJson = localStorage.getItem(CURRENT_USER_KEY);
        if (!userJson) {
            return null;
        }
        try {
            // Add default preferences if user object is from an older version
            const user = JSON.parse(userJson) as User;
            if (!user.notificationPreferences) {
                user.notificationPreferences = {
                    dailySpecialDay: true,
                    communityActivity: true,
                };
            }
            return user;
        } catch (error) {
            console.error("Failed to parse current user from localStorage", error);
            return null;
        }
    },

    updateNotificationPreferences: (userId: string, prefs: NotificationPreferences): Promise<User> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = getUsers();
                const userIndex = users.findIndex(u => u.id === userId);
                if (userIndex === -1) {
                    return reject(new Error('User not found.'));
                }

                // Update the user in the main user list
                users[userIndex].notificationPreferences = prefs;
                saveUsers(users);

                // Update the currently logged-in user session
                const updatedPublicUser = toUser(users[userIndex]);
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedPublicUser));
                
                resolve(updatedPublicUser);
            }, 200); // Simulate short network delay
        });
    }
};