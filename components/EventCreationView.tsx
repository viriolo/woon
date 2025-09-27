import React, { useState } from "react";
import type { Event } from "../types";
import type { AuthUser } from "../src/services/authService";
import { eventService } from "../services/eventService";
import { XCircleIcon, LoadingSpinner, CheckCircleIcon } from "./icons";
import { AddToCalendarButton } from "add-to-calendar-button-react";

interface EventCreationViewProps {
    user: AuthUser;
    onClose: () => void;
    onEventCreated: (event: Event) => void;
}

export const EventCreationView: React.FC<EventCreationViewProps> = ({ user, onClose, onEventCreated }) => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

    const handleSubmit = async (eventObj: React.FormEvent) => {
        eventObj.preventDefault();
        if (!title || !date || !time || !location || !description) {
            setError("All fields are required.");
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            const newEvent = await eventService.createEvent({ title, date, time, location, description }, user);
            setCreatedEvent(newEvent);
        } catch (err: any) {
            setError(err.message || "An error occurred while creating the event.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        if (createdEvent) {
            onEventCreated(createdEvent);
        }
        onClose();
    };

    if (createdEvent) {
        const endDate = new Date(`${createdEvent.date}T${createdEvent.time}`);
        endDate.setHours(endDate.getHours() + 1);
        const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

        return (
            <div className="modal-backdrop" onClick={handleCloseSuccess}>
                <div className="modal-surface max-w-md space-y-6 text-center" onClick={eventObj => eventObj.stopPropagation()}>
                    <CheckCircleIcon className="mx-auto h-14 w-14 text-emerald-500" />
                    <div className="space-y-2">
                        <h2 className="text-heading text-2xl text-ink-900">Event published!</h2>
                        <p className="text-sm text-ink-500">Your event "{createdEvent.title}" is now live for the community.</p>
                    </div>
                    <AddToCalendarButton
                        name={createdEvent.title}
                        description={createdEvent.description}
                        location={createdEvent.location}
                        startDate={createdEvent.date}
                        endDate={createdEvent.date}
                        startTime={createdEvent.time}
                        endTime={endTime}
                        timeZone="currentBrowser"
                        buttonStyle="round"
                        lightMode="light"
                        label="Add to calendar"
                        options={["Apple", "Google", "iCal", "Outlook.com", "Yahoo"]}
                    />
                    <button type="button" onClick={handleCloseSuccess} className="pill-button pill-accent w-full justify-center">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-surface max-w-lg space-y-6" onClick={eventObj => eventObj.stopPropagation()}>
                <button onClick={onClose} className="absolute right-6 top-6 text-ink-400 transition hover:text-ink-600" aria-label="Close event creation">
                    <XCircleIcon className="h-7 w-7" />
                </button>

                <header className="space-y-2 pr-8">
                    <span className="section-heading text-ink-400">Host a gathering</span>
                    <h2 className="text-heading text-2xl">Create an event</h2>
                    <p className="text-sm text-ink-500">Invite neighbors to celebrate together with clear details and timing.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Event title"
                        required
                        disabled={isLoading}
                        className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                        />
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                        />
                    </div>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location (e.g., Community Garden)"
                        required
                        disabled={isLoading}
                        className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your event..."
                        rows={5}
                        required
                        disabled={isLoading}
                        className="w-full rounded-xl border border-transparent bg-white/85 px-4 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />

                    {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                    <button type="submit" disabled={isLoading} className="pill-button pill-accent w-full justify-center">
                        {isLoading ? (
                            <>
                                <LoadingSpinner className="h-5 w-5" />
                                Creating event...
                            </>
                        ) : (
                            "Publish event"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
