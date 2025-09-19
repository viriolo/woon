import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { DiscoveryView } from './components/DiscoveryView';
import { CreateView } from './components/CreateView';
import { ConnectView } from './components/ConnectView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { EventCreationView } from './components/EventCreationView';
import { EventDetailView } from './components/EventDetailView';
import type { User, NotificationPreferences, Event } from './types';
import { TODAY_SPECIAL_DAY, TOMORROW_SPECIAL_DAY, CELEBRATIONS } from './constants';
import { authService } from './services/authService';
import { LoadingSpinner } from './components/icons';
import { eventService } from './services/eventService';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isAuthViewVisible, setIsAuthViewVisible] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isEventCreationVisible, setIsEventCreationVisible] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Session check is now synchronous and fast
                const user = authService.checkSession();
                if (user) {
                    setCurrentUser(user);
                }
                // Fetch events from localStorage
                const storedEvents = await eventService.getEvents();
                setEvents(storedEvents);
            } catch (error) {
                console.error("Initialization failed:", error);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeApp();
    }, []);

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        setIsAuthViewVisible(false);
    };

    const handleLogout = async () => {
        setIsAuthLoading(true);
        try {
            await authService.logOut();
            setCurrentUser(null);
            setActiveTab('today');
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handlePreferencesChange = async (newPrefs: Partial<NotificationPreferences>) => {
        if (!currentUser) return;
        
        try {
            const updatedUser = await authService.updateNotificationPreferences(newPrefs);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to update preferences:", error);
        }
    };
    
    const handleEventCreated = (newEvent: Event) => {
        setEvents(prevEvents => [...prevEvents, newEvent]);
        setIsEventCreationVisible(false);
    };

    const handleSetTab = (tab: string) => {
        if (tab === 'share' && !currentUser) {
            setIsAuthViewVisible(true);
        } else {
            setActiveTab(tab);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'today':
                return <DiscoveryView specialDay={TODAY_SPECIAL_DAY} tomorrowSpecialDay={TOMORROW_SPECIAL_DAY} celebrations={CELEBRATIONS} />;
            case 'share':
                return currentUser ? <CreateView specialDay={TODAY_SPECIAL_DAY} /> : null;
            case 'connect':
                return <ConnectView currentUser={currentUser} onShowEventCreation={() => setIsEventCreationVisible(true)} events={events} onViewEvent={setViewingEvent} />;
            case 'profile':
                return <ProfileView currentUser={currentUser} onLogout={handleLogout} onShowAuth={() => setIsAuthViewVisible(true)} onPreferencesChange={handlePreferencesChange} />;
            default:
                return <DiscoveryView specialDay={TODAY_SPECIAL_DAY} tomorrowSpecialDay={TOMORROW_SPECIAL_DAY} celebrations={CELEBRATIONS} />;
        }
    };
    
    if (isInitializing) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-50">
                <h1 className="text-4xl font-celebration text-special-primary mb-4">Woon</h1>
                <LoadingSpinner className="h-8 w-8 text-special-primary" />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-neutral-50">
            <Header 
                isAuthLoading={isAuthLoading}
                currentUser={currentUser} 
                setActiveTab={setActiveTab} 
                onShowAuth={() => setIsAuthViewVisible(true)}
            />
            <main className="flex-grow overflow-hidden relative">
                {renderContent()}
            </main>
            <BottomNavBar activeTab={activeTab} setActiveTab={handleSetTab} />
            {isAuthViewVisible && (
                <AuthView
                    onClose={() => setIsAuthViewVisible(false)}
                    onLoginSuccess={handleLoginSuccess}
                    onSetAuthLoading={setIsAuthLoading}
                />
            )}
            {isEventCreationVisible && currentUser && (
                <EventCreationView
                    user={currentUser}
                    onClose={() => setIsEventCreationVisible(false)}
                    onEventCreated={handleEventCreated}
                />
            )}
            {viewingEvent && (
                <EventDetailView
                    event={viewingEvent}
                    onClose={() => setViewingEvent(null)}
                />
            )}
        </div>
    );
};

export default App;