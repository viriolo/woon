
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
            commentCount: 0,
            position: {
                lng: USER_LOCATION.lng + (Math.random() - 0.5) * 0.1,
                lat: USER_LOCATION.lat + (Math.random() - 0.5) * 0.1,
            }
        };

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const celebrations = getStoredCelebrations();
        celebrations.push(newCelebration);
        saveStoredCelebrations(celebrations);

        return newCelebration;
    },

    updateLikeCount: async (celebrationId: number, increment: boolean): Promise<Celebration> => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const allCelebrations = getAllCelebrations();
        const celebrationIndex = allCelebrations.findIndex(c => c.id === celebrationId);

        if (celebrationIndex === -1) throw new Error("Celebration not found.");
        
        const celebration = allCelebrations[celebrationIndex];
        celebration.likes += increment ? 1 : -1;

        const userCelebrations = getStoredCelebrations();
        const userCelebrationIndex = userCelebrations.findIndex(c => c.id === celebrationId);
        if (userCelebrationIndex !== -1) {
             userCelebrations[userCelebrationIndex] = celebration;
             saveStoredCelebrations(userCelebrations);
        }

        return celebration;
    },

    incrementCommentCount: async (celebrationId: number): Promise<Celebration> => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const allCelebrations = getAllCelebrations();
        const celebrationIndex = allCelebrations.findIndex(c => c.id === celebrationId);

        if (celebrationIndex === -1) throw new Error("Celebration not found.");

        const celebration = allCelebrations[celebrationIndex];
        celebration.commentCount += 1;

        const userCelebrations = getStoredCelebrations();
        const userCelebrationIndex = userCelebrations.findIndex(c => c.id === celebrationId);
        if (userCelebrationIndex !== -1) {
             userCelebrations[userCelebrationIndex] = celebration;
             saveStoredCelebrations(userCelebrations);
        }

        return celebration;
    }
};
