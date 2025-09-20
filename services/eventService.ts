

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
        eventData: Omit<Event, 'id' | 'authorId' | 'authorName' | 'locationCoords' | 'attendeeCount' | 'attendees'>,
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
            attendeeCount: 0,
            attendees: [],
            // Mock geocoding: add random coordinates around SF
            locationCoords: {
                lng: -122.4194 + (Math.random() - 0.5) * 0.08,
                lat: 37.7749 + (Math.random() - 0.5) * 0.08,
            }
        };

        // Simulate async API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const events = getStoredEvents();
        events.push(newEvent);
        saveStoredEvents(events);

        return newEvent;
    },

    toggleRsvp: async (eventId: string, user: User): Promise<Event> => {
        await new Promise(res => setTimeout(res, 100));
        const events = getStoredEvents();
        const eventIndex = events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) throw new Error("Event not found.");

        const event = events[eventIndex];
        const isAttending = event.attendees.some(a => a.userId === user.id);

        if (isAttending) {
            event.attendees = event.attendees.filter(a => a.userId !== user.id);
        } else {
            event.attendees.push({
                userId: user.id,
                userName: user.name,
                avatarUrl: user.avatarUrl
            });
        }
        event.attendeeCount = event.attendees.length;

        saveStoredEvents(events);
        return event;
    }
};
