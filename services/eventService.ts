
import type { Event, User } from '../types';

const EVENTS_STORAGE_KEY = 'woon_events';

// In a real app, this service would communicate with a secure backend API.
// For now, we simulate this with localStorage.

const getStoredEvents = (): Event[] => {
    try {
        const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
        return storedEvents ? JSON.parse(storedEvents) : [];
    } catch (error) {
        console.error("Failed to parse events from localStorage", error);
        return [];
    }
};

const saveStoredEvents = (events: Event[]) => {
    try {
        localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
        console.error("Failed to save events to localStorage", error);
    }
};

export const eventService = {
    getEvents: async (): Promise<Event[]> => {
        // Simulate async API call
        await new Promise(resolve => setTimeout(resolve, 100));
        return getStoredEvents();
    },

    createEvent: async (
        eventData: Omit<Event, 'id' | 'authorId' | 'authorName'>,
        user: User
    ): Promise<Event> => {
        if (!user) {
            throw new Error("Authentication required to create an event.");
        }

        const newEvent: Event = {
            id: new Date().toISOString() + Math.random(),
            ...eventData,
            authorId: user.id,
            authorName: user.name,
        };

        // Simulate async API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const events = getStoredEvents();
        events.push(newEvent);
        saveStoredEvents(events);

        return newEvent;
    },
};
