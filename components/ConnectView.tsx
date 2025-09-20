
import React, { useState } from 'react';
import type { User, Event } from '../types';
import { ConnectIcon, MapIcon, FlagIcon, GlobeAltIcon, BuildingOfficeIcon, CalendarPlusIcon, UsersIcon, ClockIcon } from './icons';

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

const ScopeContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="p-4 animate-fade-in space-y-4">{children}</div>
);

const EventCard: React.FC<{ event: Event; onClick: () => void; }> = ({ event, onClick }) => (
    <button onClick={onClick} className="w-full text-left p-4 bg-white rounded-lg border border-neutral-200/50 shadow-sm hover:bg-neutral-100/50 transition-colors">
        <h4 className="font-bold text-neutral-900">{event.title}</h4>
        <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-500">{event.date} at {event.time} - {event.location}</p>
            {event.attendeeCount > 0 && (
                <div className="flex items-center gap-1 text-sm text-special-secondary font-medium">
                    <UsersIcon className="w-4 h-4"/>
                    <span>{event.attendeeCount}</span>
                </div>
            )}
        </div>
        <p className="text-sm text-neutral-400 mt-1">Organized by {event.authorName}</p>
    </button>
);

const globalCelebrations = [
  {
    title: 'World Environment Day',
    status: 'Live Now',
    statusColor: 'green',
    participants: 45623,
    scope: 'Global',
    peakTime: '14:00 UTC',
    activities: ['Tree Planting (Asia)', 'Beach Cleanup (Americas)', 'Green Markets (Europe)'],
  },
  {
    title: 'International Yoga Day',
    status: 'Ending Soon',
    statusColor: 'yellow',
    participants: 23891,
    scope: 'India + 89 countries',
    peakTime: '06:00 IST',
    activities: ['Mass Yoga (India)', 'Park Sessions (US)', 'Corporate Wellness (Europe)'],
  },
];

const GlobalCelebrationCard: React.FC<{ celebration: typeof globalCelebrations[0] }> = ({ celebration }) => {
    const statusClasses = {
        green: 'bg-green-100 text-green-800',
        yellow: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
        <div className="bg-white rounded-lg border border-neutral-200/50 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-neutral-900">{celebration.title}</h3>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClasses[celebration.statusColor as keyof typeof statusClasses]}`}>
                            {celebration.status}
                        </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500 mt-1">
                        <div className="flex items-center gap-1.5">
                            <UsersIcon className="w-4 h-4" />
                            <span>{celebration.participants.toLocaleString()} participants</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <GlobeAltIcon className="w-4 h-4" />
                            <span>{celebration.scope}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ClockIcon className="w-4 h-4" />
                            <span>Peak: {celebration.peakTime}</span>
                        </div>
                    </div>
                </div>
                <button className="flex-shrink-0 ml-4 px-4 py-2 bg-special-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                    Join Celebration
                </button>
            </div>
            <div>
                <h4 className="font-medium text-neutral-800">How the world is celebrating:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {celebration.activities.map(activity => (
                        <span key={activity} className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm">
                            {activity}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};


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
                    <ScopeContent>
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
                           <div className="p-4 bg-white rounded-lg border border-neutral-200/50 shadow-sm">
                                <h4 className="font-bold text-neutral-900">No local events yet</h4>
                                <p className="text-sm text-neutral-500">Be the first to create one!</p>
                           </div>
                       )}
                    </ScopeContent>
                );
            case 'regional':
            case 'national':
            case 'global':
                 return (
                    <ScopeContent>
                        {globalCelebrations.map(c => <GlobalCelebrationCard key={c.title} celebration={c} />)}
                    </ScopeContent>
                );
            case 'business':
                 return (
                    <ScopeContent>
                        <div className="p-4 bg-white rounded-lg border border-neutral-200/50 shadow-sm">
                            <h4 className="font-bold text-neutral-900">Create a Campaign</h4>
                            <p className="text-sm text-neutral-500">Engage customers with special day offers.</p>
                        </div>
                         <div className="p-4 bg-white rounded-lg border border-neutral-200/50 shadow-sm">
                            <h4 className="font-bold text-neutral-900">Analytics Dashboard</h4>
                            <p className="text-sm text-neutral-500">Track your promotion's impact.</p>
                        </div>
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
