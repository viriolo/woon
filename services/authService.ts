
import type { User, NotificationPreferences } from '../types';

// In a real app, this service communicates with a secure backend API.
// The API endpoints here are placeholders for your backend implementation (e.g., using Netlify Functions, Google Cloud Functions).

const handleResponse = async (response: Response) => {
    if (response.status === 204) { // No Content
        return null;
    }
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const authService = {
    signUp: (name: string, email: string, password: string): Promise<User> => {
        return fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        }).then(handleResponse);
    },

    logIn: (email: string, password: string): Promise<User> => {
        return fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        }).then(handleResponse);
    },

    logOut: (): Promise<void> => {
        return fetch('/api/auth/logout', {
            method: 'POST',
        }).then(handleResponse);
    },

    checkSession: (): Promise<User | null> => {
        // This endpoint would check for a session cookie (e.g., httpOnly)
        // and return the user object if logged in.
        return fetch('/api/auth/me')
            .then(response => {
                if (response.status === 401) { // Unauthorized
                    return null;
                }
                return handleResponse(response);
            });
    },

    updateNotificationPreferences: (prefs: Partial<NotificationPreferences>): Promise<User> => {
        return fetch('/api/user/preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prefs),
        }).then(handleResponse);
    }
};
