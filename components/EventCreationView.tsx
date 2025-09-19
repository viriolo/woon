
import React, { useState } from 'react';
import type { User, Event } from '../types';
import { eventService } from '../services/eventService';
import { XCircleIcon, LoadingSpinner } from './icons';

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
            onEventCreated(newEvent);
        } catch (err: any) {
            setError(err.message || 'An error occurred while creating the event.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col" onClick={onClose}>
            <div className="relative w-full h-full max-w-lg mx-auto bg-neutral-900 p-4 animate-slide-up overflow-y-auto" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between py-4">
                    <h2 className="text-3xl font-display font-bold text-special-primary">
                        Create Event
                    </h2>
                     <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors" aria-label="Close event creation">
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </header>
                
                <p className="text-neutral-400 mb-6">
                    Organize a gathering for your community to celebrate together.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Event Title" required disabled={isLoading}
                        className="w-full p-3 bg-neutral-800 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="date" value={date} onChange={(e) => setDate(e.target.value)}
                            required disabled={isLoading}
                            className="w-full p-3 bg-neutral-800 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                        />
                         <input
                            type="time" value={time} onChange={(e) => setTime(e.target.value)}
                            required disabled={isLoading}
                            className="w-full p-3 bg-neutral-800 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                        />
                    </div>
                    <input
                        type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location (e.g., Central Park)" required disabled={isLoading}
                        className="w-full p-3 bg-neutral-800 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                     <textarea
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your event..." rows={5} required disabled={isLoading}
                        className="w-full p-3 bg-neutral-800 rounded-lg placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition disabled:opacity-50"
                    />
                    
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 flex justify-center items-center gap-2 bg-special-primary text-neutral-900 font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
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
