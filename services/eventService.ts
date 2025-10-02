import type { Event } from "../types";
import type { AuthUser } from "../src/services/authService";
import { supabaseEventService } from "./supabaseEventService";

export const eventService = {
    async getEvents(): Promise<Event[]> {
        return supabaseEventService.getEvents();
    },

    async createEvent(
        eventData: Omit<Event, "id" | "authorId" | "authorName" | "locationCoords" | "attendeeCount" | "attendees">,
        user: AuthUser
    ): Promise<Event> {
        if (!user) {
            throw new Error("Authentication required to create an event.");
        }

        return supabaseEventService.createEvent(
            {
                title: eventData.title,
                description: eventData.description,
                date: eventData.date,
                time: eventData.time,
                location: eventData.location,
            },
            user.id,
            user.name
        );
    },

    async toggleRsvp(eventId: string): Promise<Event> {
        const updatedEvent = await supabaseEventService.getEventById(eventId);
        if (!updatedEvent) {
            throw new Error("Event not found.");
        }
        return updatedEvent;
    },

    subscribeToEvents: supabaseEventService.subscribeToEvents,
};
