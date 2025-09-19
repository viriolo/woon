import React, { useState } from 'react';
import type { User, Event } from '../types';
import { eventService } from '../services/eventService';
import { XCircleIcon, LoadingSpinner, CheckCircleIcon } from './icons';
import { AddToCalendarButton } from 'add-to-calendar-button-react';

interface EventCreationViewProps {
    user: User;
    onClose: () => void;
    onEventCreated: (event: Event) => void;
}

export const EventCreationView: React.FC<EventCreationViewProps> = ({ user, onClose, onEventCreated }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !time || !location || !description) {
            setError("All fields are required.");
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const newEvent = await eventService.createEvent(
                { title, date, time, location, description },
                user
            );
            setCreatedEvent(newEvent);
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating the event.');
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
        const [hours, minutes] = createdEvent.time.split(':').map(Number);
        const endDate = new Date(`${createdEvent.date}T${createdEvent.time}`);
        endDate.setHours(endDate.getHours() + 1); // Assume 1 hour duration
        const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        
        return (
             <div className="fixed inset-0 z-50 bg-neutral-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg text-center animate-fade-in">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-display font-bold text-special-primary">
                        Event Published!
                    </h2>
                     <p className="text-neutral-500 mt-2 mb-6">
                        Your event, "{createdEvent.title}", is now live for the community.
                    </p>
                    
                    <div className="inline-block my-4">
                       <AddToCalendarButton
                            name={createdEvent.title}
                            description={createdEvent.description}
                            location={createdEvent.location}
                            startDate={createdEvent.date}
                            endDate={createdEvent.date}
                            startTime={createdEvent.time}
                            endTime={endTime}
                            timeZone="currentBrowser"
                            buttonStyle="default"
                            lightMode="light"
                            label="Add to Calendar"
                            options={['Apple','Google','iCal','Outlook.com','Yahoo']}
                        />
                    </div>

                     <button
                        onClick={handleCloseSuccess}
                        className="w-full max-w-xs mx-auto py-3 px-4 flex justify-center items-center gap-2 bg-special-primary text-white font-bold rounded-lg hover:opacity-90 transition"
                    >
                       Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-neutral-50 flex flex-col">
            <div className="relative w-full h-full max-w-lg mx-auto bg-neutral-50 p-4 animate-slide-up overflow-y-auto" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between py-4">
                    <h2 className="text-3xl font-display font-bold text-special-primary">
                        Create Event
                    </h2>
                     <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 transition-colors" aria-label="Close event creation">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </header>
                
                <p className="text-neutral-500 mb-6">
                    Organize a gathering for your community to celebrate together.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Event Title" required disabled={isLoading}
                        className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="date" value={date} onChange={(e) => setDate(e.target.value)}
                            required disabled={isLoading}
                            className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                        />
                         <input
                            type="time" value={time} onChange={(e) => setTime(e.target.value)}
                            required disabled={isLoading}
                            className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                        />
                    </div>
                    <input
                        type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location (e.g., Central Park)" required disabled={isLoading}
                        className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                     <textarea
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your event..." rows={5} required disabled={isLoading}
                        className="w-full p-3 bg-white border border-neutral-300 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 flex justify-center items-center gap-2 bg-special-primary text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner className="h-5 w-5" />
                                <span>Creating Event...</span>
                            </>
                        ) : 'Publish Event'}
                    </button>
                </form>
            </div>
        </div>
    );
};