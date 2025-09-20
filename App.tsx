
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { DiscoveryView } from './components/DiscoveryView';
import { CreateView } from './components/CreateView';
import { ConnectView } from './components/ConnectView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { EventCreationView } from './components/EventCreationView';
import { EventDetailView } from './components/EventDetailView';
import { MissionView } from './components/MissionView';
import type { User, NotificationPreferences, Event, Celebration } from './types';
import { TODAY_SPECIAL_DAY as MOCK_TODAY_SPECIAL_DAY, TOMORROW_SPECIAL_DAY, CELEBRATIONS as MOCK_CELEBRATIONS } from './constants';
import { authService } from './services/authService';
import { LoadingSpinner } from './components/icons';
import { eventService } from './services/eventService';
import { celebrationService } from './services/celebrationService';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('woon-active-tab');
        return savedTab || 'today';
    });
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [isAuthViewVisible, setIsAuthViewVisible] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isEventCreationVisible, setIsEventCreationVisible] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [celebrations, setCelebrations] = useState<Celebration[]>([]);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [isMissionViewVisible, setIsMissionViewVisible] = useState(false);

    const todaySpecialDay = useMemo(() => {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
        return {
            ...MOCK_TODAY_SPECIAL_DAY,
            date: today.toLocaleDateString('en-US', options),
        };
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const user = authService.checkSession();
                if (user) {
                    setCurrentUser(user);
                }
                const storedEvents = await eventService.getEvents();
                setEvents(storedEvents);

                const storedCelebrations = await celebrationService.getCelebrations();
                // Combine mock celebrations with user-created ones
                setCelebrations([...MOCK_CELEBRATIONS, ...storedCelebrations]);

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

    const handleAvatarChange = async (base64Image: string) => {
        if (!currentUser) return;
        try {
            const updatedUser = await authService.updateAvatar(base64Image);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to update avatar:", error);
        }
    };
    
    const handleEventCreated = (newEvent: Event) => {
        setEvents(prevEvents => [...prevEvents, newEvent]);
        setIsEventCreationVisible(false);
    };

    const handleCelebrationCreated = (newCelebration: Celebration) => {
        setCelebrations(prev => [...prev, newCelebration]);
        // Switch to the discovery view to see the new celebration
        setActiveTab('today');
    };
    
    const handleToggleLike = async (celebrationId: number) => {
        if (!currentUser) {
            setIsAuthViewVisible(true);
            return;
        }

        const isLiked = currentUser.likedCelebrationIds.includes(celebrationId);
        
        // Optimistic UI updates
        const originalUser = currentUser;
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                likedCelebrationIds: isLiked
                    ? prevUser.likedCelebrationIds.filter(id => id !== celebrationId)
                    : [...prevUser.likedCelebrationIds, celebrationId]
            };
        });
        setCelebrations(prevCelebrations =>
            prevCelebrations.map(c =>
                c.id === celebrationId ? { ...c, likes: c.likes + (isLiked ? -1 : 1) } : c
            )
        );

        try {
            await authService.toggleLikeStatus(celebrationId);
            await celebrationService.updateLikeCount(celebrationId, !isLiked);
        } catch (error) {
            console.error("Failed to toggle like:", error);
            // Revert optimistic updates on error
            setCurrentUser(originalUser);
             setCelebrations(prevCelebrations =>
                prevCelebrations.map(c =>
                    c.id === celebrationId ? { ...c, likes: c.likes + (isLiked ? 1 : -1) } : c
                )
            );
        }
    };

    const handleToggleSave = async (celebrationId: number) => {
        if (!currentUser) {
            setIsAuthViewVisible(true);
            return;
        }
        const originalUser = currentUser;
        const isSaved = currentUser.savedCelebrationIds.includes(celebrationId);
        
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                savedCelebrationIds: isSaved
                    ? prevUser.savedCelebrationIds.filter(id => id !== celebrationId)
                    : [...prevUser.savedCelebrationIds, celebrationId]
            };
        });

        try {
            await authService.toggleSaveStatus(celebrationId);
        } catch(error) {
            console.error("Failed to toggle save:", error);
            setCurrentUser(originalUser);
        }
    };
    
    const handleRsvpToggle = async (eventId: string) => {
        if (!currentUser) {
            setIsAuthViewVisible(true);
            return;
        }

        const isRsvped = currentUser.rsvpedEventIds.includes(eventId);

        const originalUser = currentUser;
        const originalEvents = [...events];

        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                rsvpedEventIds: isRsvped
                    ? prevUser.rsvpedEventIds.filter(id => id !== eventId)
                    : [...prevUser.rsvpedEventIds, eventId]
            };
        });

        setEvents(prevEvents => prevEvents.map(e => {
            if (e.id === eventId) {
                const newAttendees = isRsvped
                    ? e.attendees.filter(a => a.userId !== currentUser.id)
                    : [...e.attendees, { userId: currentUser.id, userName: currentUser.name, avatarUrl: currentUser.avatarUrl }];
                return {
                    ...e,
                    attendees: newAttendees,
                    attendeeCount: newAttendees.length,
                };
            }
            return e;
        }));
        
        setViewingEvent(prevEvent => {
            if(prevEvent?.id === eventId) {
                 const newAttendees = isRsvped
                    ? prevEvent.attendees.filter(a => a.userId !== currentUser.id)
                    : [...prevEvent.attendees, { userId: currentUser.id, userName: currentUser.name, avatarUrl: currentUser.avatarUrl }];
                 return { ...prevEvent, attendees: newAttendees, attendeeCount: newAttendees.length };
            }
            return prevEvent;
        });

        try {
            await authService.toggleRsvpStatus(eventId);
            await eventService.toggleRsvp(eventId, currentUser);
        } catch (error) {
            console.error("Failed to toggle RSVP", error);
            setCurrentUser(originalUser);
            setEvents(originalEvents);
            setViewingEvent(originalEvents.find(e => e.id === eventId) || null);
        }
    };


    const handleSetTab = (tab: string) => {
        console.log('handleSetTab called with:', tab, 'currentUser:', currentUser);
        if (tab === 'share' && !currentUser) {
            setIsAuthViewVisible(true);
        } else {
            setActiveTab(tab);
            localStorage.setItem('woon-active-tab', tab);
            console.log('activeTab set to:', tab);
        }
    };

    const renderContent = () => {
        console.log('renderContent called with activeTab:', activeTab);
        switch (activeTab) {
            case 'today':
                return <DiscoveryView 
                            specialDay={todaySpecialDay} 
                            tomorrowSpecialDay={TOMORROW_SPECIAL_DAY} 
                            celebrations={celebrations} 
                            currentUser={currentUser}
                            onToggleLike={handleToggleLike}
                            onToggleSave={handleToggleSave}
                       />;
            case 'share':
                return currentUser ? <CreateView user={currentUser} specialDay={todaySpecialDay} onCelebrationCreated={handleCelebrationCreated} /> : null;
            case 'connect':
                return <ConnectView currentUser={currentUser} onShowEventCreation={() => setIsEventCreationVisible(true)} events={events} onViewEvent={setViewingEvent} />;
            case 'profile':
                console.log('Rendering ProfileView for profile tab');
                return <ProfileView currentUser={currentUser} onLogout={handleLogout} onShowAuth={() => setIsAuthViewVisible(true)} onPreferencesChange={handlePreferencesChange} onAvatarChange={handleAvatarChange} celebrations={celebrations} onShowMission={() => setIsMissionViewVisible(true)} />;
            default:
                return <DiscoveryView 
                            specialDay={todaySpecialDay} 
                            tomorrowSpecialDay={TOMORROW_SPECIAL_DAY} 
                            celebrations={celebrations} 
                            currentUser={currentUser}
                            onToggleLike={handleToggleLike}
                            onToggleSave={handleToggleSave}
                       />;
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
                    currentUser={currentUser}
                    onClose={() => setViewingEvent(null)}
                    onRsvpToggle={handleRsvpToggle}
                />
            )}
            {isMissionViewVisible && (
                <MissionView onClose={() => setIsMissionViewVisible(false)} />
            )}
        </div>
    );
};

export default App;
