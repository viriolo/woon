
import type { Celebration, User } from '../types';
import { USER_LOCATION, CELEBRATIONS as MOCK_CELEBRATIONS } from '../constants';

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

const getAllCelebrations = (): Celebration[] => {
    const userCelebrations = getStoredCelebrations();
    // In a real app, you'd fetch all from a DB. Here we merge localStorage with mocks.
    // To prevent duplicates, we'll filter mocks that might have same ID as stored ones.
    const userCelebrationIds = new Set(userCelebrations.map(c => c.id));
    const uniqueMocks = MOCK_CELEBRATIONS.filter(c => !userCelebrationIds.has(c.id));
    return [...uniqueMocks, ...userCelebrations];
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

    updateLikeCount: async (celebrationId: number, increment: boolean): Promise<Celebration> => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
        const allCelebrations = getAllCelebrations();
        const celebrationIndex = allCelebrations.findIndex(c => c.id === celebrationId);

        if (celebrationIndex === -1) {
            throw new Error("Celebration not found.");
        }
        
        const celebration = allCelebrations[celebrationIndex];
        celebration.likes += increment ? 1 : -1;

        // Only save back the user-created celebrations part
        const userCelebrations = allCelebrations.filter(c => getStoredCelebrations().some(sc => sc.id === c.id));
        const userCelebrationIndex = userCelebrations.findIndex(c => c.id === celebrationId);
        if (userCelebrationIndex !== -1) {
             userCelebrations[userCelebrationIndex] = celebration;
             saveStoredCelebrations(userCelebrations);
        }
        // Note: Mock celebrations' like counts will reset on page load as they aren't persisted.

        return celebration;
    },
};