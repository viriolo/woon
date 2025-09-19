
import React, { useState } from 'react';
import type { User, Event } from '../types';
import { ConnectIcon, MapIcon, FlagIcon, GlobeAltIcon, BuildingOfficeIcon, CalendarPlusIcon } from './icons';

type Scope = 'local' | 'regional' | 'national' | 'global' | 'business';

interface ConnectViewProps {
    currentUser: User | null;
    onShowEventCreation: () => void;
    events: Event[];
    onViewEvent: (event: Event) => void;
}

interface ScopePillProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    isPremium?: boolean;
    onClick: () => void;
}

const ScopePill: React.FC<ScopePillProps> = ({ label, icon, isActive, isPremium, onClick }) => (
    <button
        onClick={onClick}
        className={`relative flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isActive
                ? 'bg-special-primary text-white'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
        }`}
    >
        {icon}
        <span>{label}</span>
        {isPremium && (
            <span className="absolute -top-1 -right-1 text-[9px] bg-yellow-400 text-neutral-900 font-bold px-1.5 rounded-full">PRO</span>
        )}
    </button>
);

const ScopeContent: React.FC<{ title: string, description: string, children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="p-4 animate-fade-in">
        <h3 className="text-xl font-bold font-display text-special-secondary">{title}</h3>
        <p className="text-neutral-500 mb-4">{description}</p>
        <div className="space-y-4">{children}</div>
    </div>
);

const EventCard: React.FC<{ event: Event; onClick: () => void; }> = ({ event, onClick }) => (
    <button onClick={onClick} className="w-full text-left p-4 bg-white rounded-lg border border-neutral-200/50 shadow-sm hover:bg-neutral-100/50 transition-colors">
        <h4 className="font-bold text-neutral-900">{event.title}</h4>
        <p className="text-sm text-neutral-500">{event.date} at {event.time} - {event.location}</p>
        <p className="text-sm text-neutral-400 mt-1">Organized by {event.authorName}</p>
    </button>
);

const MockContentCard: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
    <div className="p-4 bg-white rounded-lg border border-neutral-200/50 shadow-sm">
        <h4 className="font-bold text-neutral-900">{title}</h4>
        <p className="text-sm text-neutral-500">{subtitle}</p>
    </div>
);

export const ConnectView: React.FC<ConnectViewProps> = ({ currentUser, onShowEventCreation, events, onViewEvent }) => {
    const [activeScope, setActiveScope] = useState<Scope>('local');

    const scopes: { id: Scope; label: string; icon: React.ReactNode; isPremium?: boolean }[] = [
        { id: 'local', label: 'Local', icon: <ConnectIcon className="w-4 h-4" /> },
        { id: 'regional', label: 'Regional', icon: <MapIcon className="w-4 h-4" /> },
        { id: 'national', label: 'National', icon: <FlagIcon className="w-4 h-4" /> },
        { id: 'global', label: 'Global', icon: <GlobeAltIcon className="w-4 h-4" /> },
        { id: 'business', label: 'Business', icon: <BuildingOfficeIcon className="w-4 h-4" />, isPremium: true },
    ];

    const renderContent = () => {
        switch(activeScope) {
            case 'local':
                return (
                    <ScopeContent title="Your Neighborhood" description="See what's happening right around you.">
                        {currentUser && (
                             <button
                                onClick={onShowEventCreation}
                                className="w-full flex items-center justify-center gap-2 p-4 text-left bg-special-primary/10 text-special-secondary hover:bg-special-primary/20 transition-colors rounded-lg border border-special-primary/20"
                            >
                                <CalendarPlusIcon className="w-6 h-6" />
                                <span className="font-bold">Create Community Event</span>
                            </button>
                        )}
                       {events.length > 0 ? (
                           events.map(event => <EventCard key={event.id} event={event} onClick={() => onViewEvent(event)} />)
                       ) : (
                           <MockContentCard title="No local events yet" subtitle="Be the first to create one!" />
                       )}
                    </ScopeContent>
                );
            case 'regional':
                return (
                    <ScopeContent title="City-Wide Festivities" description="Explore celebrations across the entire region.">
                        <MockContentCard title="Creativity Fair at City Hall" subtitle="Over 200 artists and creators featured." />
                        <MockContentCard title="Regional Photo Contest" subtitle="Theme: 'What Creativity Means to You'." />
                    </ScopeContent>
                );
            case 'national':
                return (
                    <ScopeContent title="Across the Nation" description="Discover how the country is celebrating today.">
                        <MockContentCard title="Trending: #WorldCreativityDay" subtitle="See top posts from all states." />
                        <MockContentCard title="National Art Grants Announced" subtitle="Supporting creative projects nationwide." />
                    </ScopeContent>
                );
            case 'global':
                 return (
                    <ScopeContent title="Around the World" description="Follow the celebration as it unfolds globally.">
                        <MockContentCard title="Live from Paris: Eiffel Tower Light Show" subtitle="A stunning display of creative lighting." />
                        <MockContentCard title="24-Hour Create-a-thon" subtitle="Join creators from different timezones." />
                    </ScopeContent>
                );
            case 'business':
                 return (
                    <ScopeContent title="Business Hub" description="Promotional tools for local businesses.">
                        <MockContentCard title="Create a Campaign" subtitle="Engage customers with special day offers." />
                        <MockContentCard title="Analytics Dashboard" subtitle="Track your promotion's impact." />
                    </ScopeContent>
                );
            default:
                return null;
        }
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="pt-20 px-4 text-center">
                <h2 className="text-3xl font-display font-bold text-special-primary">Connect</h2>
                <p className="text-neutral-700">Discover celebrations near and far.</p>
            </div>
            <div className="p-4">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                    {scopes.map(scope => (
                        <ScopePill 
                            key={scope.id}
                            label={scope.label}
                            icon={scope.icon}
                            isActive={activeScope === scope.id}
                            isPremium={scope.isPremium}
                            onClick={() => setActiveScope(scope.id)}
                        />
                    ))}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pb-24">
                {renderContent()}
            </div>
        </div>
    );
};