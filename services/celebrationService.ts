import type { Celebration, User } from '../types';
import { USER_LOCATION } from '../constants';

const CELEBRATIONS_STORAGE_KEY = 'woon_celebrations';

const getStoredCelebrations = (): Celebration[] => {
    try {
        const storedCelebrations = localStorage.getItem(CELEBRATIONS_STORAGE_KEY);
        return storedCelebrations ? JSON.parse(storedCelebrations) : [];
    } catch (error) {
        console.error("Failed to parse celebrations from localStorage", error);
        return [];
    }
};

const saveStoredCelebrations = (celebrations: Celebration[]) => {
    try {
        localStorage.setItem(CELEBRATIONS_STORAGE_KEY, JSON.stringify(celebrations));
    } catch (error) {
        console.error("Failed to save celebrations to localStorage", error);
    }
};

export const celebrationService = {
    getCelebrations: async (): Promise<Celebration[]> => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
        return getStoredCelebrations();
    },

    createCelebration: async (
        celebrationData: Pick<Celebration, 'title' | 'description' | 'imageUrl'>,
        user: User
    ): Promise<Celebration> => {
        if (!user) {
            throw new Error("Authentication required to create a celebration.");
        }

        const newCelebration: Celebration = {
            id: Date.now(),
            ...celebrationData,
            authorId: user.id,
            author: user.name,
            likes: 0,
            position: {
                // Place it randomly near the user's general location
                lng: USER_LOCATION.lng + (Math.random() - 0.5) * 0.1,
                lat: USER_LOCATION.lat + (Math.random() - 0.5) * 0.1,
            }
        };

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        const celebrations = getStoredCelebrations();
        celebrations.push(newCelebration);
        saveStoredCelebrations(celebrations);

        return newCelebration;
    },
};