import React from "react";
import type { Event, User } from "../types";
import { GoogleMap } from "./GoogleMap";
import { XCircleIcon, MapPinIcon, CalendarDaysIcon, UsersIcon } from "./icons";
import { AddToCalendarButton } from "add-to-calendar-button-react";

interface EventDetailViewProps {
    event: Event;
    currentUser: User | null;
    onClose: () => void;
    onRsvpToggle: (eventId: string) => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event, currentUser, onClose, onRsvpToggle }) => {
    const endDate = new Date(`${event.date}T${event.time}`);
    endDate.setHours(endDate.getHours() + 1);
    const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

    const isRsvped = !!currentUser?.rsvpedEventIds.includes(event.id);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-surface max-w-xl space-y-6" onClick={eventObj => eventObj.stopPropagation()}>
                <button onClick={onClose} className="absolute right-6 top-6 text-ink-400 transition hover:text-ink-600" aria-label="Close event details">
                    <XCircleIcon className="h-7 w-7" />
                </button>

                <header className="space-y-1 pr-10">
                    <p className="section-heading text-ink-400">Community event</p>
                    <h2 className="text-heading text-2xl">{event.title}</h2>
                    <p className="text-sm text-ink-500">Organized by {event.authorName}</p>
                </header>

                <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600">
                    <span className="tag-chip">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {event.date} � {event.time}
                    </span>
                    {event.attendeeCount > 0 && (
                        <span className="tag-chip">
                            <UsersIcon className="h-4 w-4" />
                            {event.attendeeCount} going
                        </span>
                    )}
                </div>

                <div className="flex items-start gap-3 text-sm text-ink-600">
                    <MapPinIcon className="mt-1 h-5 w-5 text-ink-400" />
                    <span>{event.location}</span>
                </div>

                <div className="surface-card surface-card--tight overflow-hidden p-0">
                    <GoogleMap
                        center={event.locationCoords}
                        zoom={15}
                        markers={[{
                            position: event.locationCoords,
                            title: event.title
                        }]}
                        style={{ height: "200px" }}
                    />
                </div>

                <p className="text-sm leading-relaxed text-ink-600 whitespace-pre-wrap">
                    {event.description}
                </p>

                <div className="flex flex-col gap-3">
                    <AddToCalendarButton
                        name={event.title}
                        description={event.description}
                        location={event.location}
                        startDate={event.date}
                        endDate={event.date}
                        startTime={event.time}
                        endTime={endTime}
                        timeZone="currentBrowser"
                        buttonStyle="flat"
                        lightMode="light"
                        label="Add to calendar"
                        options={["Apple", "Google", "iCal", "Outlook.com", "Yahoo"]}
                    />
                    <button
                        type="button"
                        onClick={() => onRsvpToggle(event.id)}
                        className={`pill-button w-full justify-center ${isRsvped ? "bg-emerald-100 text-emerald-700" : "pill-accent"}`}
                    >
                        {isRsvped ? "You're going" : "RSVP to event"}
                    </button>
                </div>
            </div>
        </div>
    );
};
