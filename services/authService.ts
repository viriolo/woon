import type { User } from '../types';

// In a real app, this would be a secure backend service.
// For this demo, we simulate it with localStorage.

const USERS_KEY = 'woon_users';
const CURRENT_USER_KEY = 'woon_currentUser';

// Helper to get users from localStorage
const getUsers = (): User[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save users to localStorage
const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
    signUp: (name: string, email: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate network delay
                const users = getUsers();
                const existingUser = users.find(u => u.email === email);
                if (existingUser) {
                    return reject(new Error('Email already in use.'));
                }
                const newUser: User = {
                    id: Date.now().toString(),
                    name,
                    email,
                };
                const updatedUsers = [...users, newUser];
                saveUsers(updatedUsers);
                
                // Automatically log in the new user
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
                resolve(newUser);
            }, 500);
        });
    },

    logIn: (email: string): Promise<User> => {
        return new Promise((resolve, reject) => {
             setTimeout(() => { // Simulate network delay
                const users = getUsers();
                const user = users.find(u => u.email === email);
                if (!user) {
                    return reject(new Error('Invalid email or password.'));
                }
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                resolve(user);
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
            return JSON.parse(userJson) as User;
        } catch (error) {
            console.error("Failed to parse current user from localStorage", error);
            return null;
        }
    }
};
