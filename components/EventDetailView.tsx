
import React from 'react';
import type { Event, User } from '../types';
import { MiniMap } from './MiniMap';
import { XCircleIcon, MapPinIcon, CalendarDaysIcon, UsersIcon } from './icons';
import { AddToCalendarButton } from 'add-to-calendar-button-react';

interface EventDetailViewProps {
    event: Event;
    currentUser: User | null;
    onClose: () => void;
    onRsvpToggle: (eventId: string) => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event, currentUser, onClose, onRsvpToggle }) => {
    const endDate = new Date(`${event.date}T${event.time}`);
    endDate.setHours(endDate.getHours() + 1); // Assume 1 hour duration
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    const isRsvped = !!currentUser?.rsvpedEventIds.includes(event.id);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div 
                className="relative w-full max-w-lg m-4 bg-neutral-100 border border-neutral-200 rounded-2xl shadow-2xl p-6 animate-slide-up max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-special-primary">
                            {event.title}
                        </h2>
                        <p className="text-sm text-neutral-500">Organized by {event.authorName}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 transition-colors" aria-label="Close event details">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </header>

                <div className="overflow-y-auto space-y-4 pr-2 -mr-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-700">
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                            <span className="font-medium">{event.date} at {event.time}</span>
                        </div>
                        {event.attendeeCount > 0 && (
                            <div className="flex items-center gap-2">
                                <UsersIcon className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                                <span className="font-medium">{event.attendeeCount} going</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-2 text-neutral-700">
                         <MapPinIcon className="w-5 h-5 mt-0.5 text-neutral-500 flex-shrink-0" />
                         <span>{event.location}</span>
                    </div>

                    <div className="w-full h-48 bg-neutral-200 rounded-lg overflow-hidden my-4">
                        <MiniMap center={event.locationCoords} />
                    </div>

                    <p className="text-neutral-700 whitespace-pre-wrap">
                        {event.description}
                    </p>
                </div>
                 <div className="mt-6 flex-shrink-0 space-y-2">
                    <div className="w-full">
                        <AddToCalendarButton
                            name={event.title}
                            description={event.description}
                            location={event.location}
                            startDate={event.date}
                            endDate={event.date}
                            startTime={event.time}
                            endTime={endTime}
                            timeZone="currentBrowser"
                            buttonStyle="default"
                            lightMode="light"
                            label="Add to Calendar"
                            options={['Apple','Google','iCal','Outlook.com','Yahoo']}
                        />
                    </div>
                    <button 
                        onClick={() => onRsvpToggle(event.id)}
                        className={`w-full py-3 px-4 font-bold rounded-lg transition-colors ${
                            isRsvped 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-special-primary text-white hover:opacity-90'
                        }`}
                    >
                        {isRsvped ? "✓ You're Going!" : "RSVP to Event"}
                    </button>
                </div>
            </div>
        </div>
    );
};
