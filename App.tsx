import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "./components/Header";
import { BottomNavBar } from "./components/BottomNavBar";
import { DiscoveryView } from "./components/DiscoveryView";
import { CreateView } from "./components/CreateView";
import { ConnectView } from "./components/ConnectView";
import { ProfileView } from "./components/ProfileView";
import { AuthView } from "./components/AuthView";
import { EventCreationView } from "./components/EventCreationView";
import { EventDetailView } from "./components/EventDetailView";
import { MissionView } from "./components/MissionView";
import CMSTest from "./src/components/CMSTest";
import AdminDashboard from "./src/components/admin/AdminDashboard";
import type { User, NotificationPreferences, Event, Celebration } from "./types";
import {
    TODAY_SPECIAL_DAY as MOCK_TODAY_SPECIAL_DAY,
    TOMORROW_SPECIAL_DAY,
    CELEBRATIONS as MOCK_CELEBRATIONS,
} from "./constants";
import { authService } from "./services/authService";
import { LoadingSpinner } from "./components/icons";
import { eventService } from "./services/eventService";
import { celebrationService } from "./services/celebrationService";

const ACTIVE_TAB_KEY = "woon-active-tab";

const App: React.FC = () => {
    console.log('App component is loading...');
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem(ACTIVE_TAB_KEY) || "today");
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
        const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
        return {
            ...MOCK_TODAY_SPECIAL_DAY,
            date: today.toLocaleDateString("en-US", options),
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
                setCelebrations([...MOCK_CELEBRATIONS, ...storedCelebrations]);
            } catch (error) {
                console.error("Initialization failed:", error);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeApp();
    }, []);

    const requireAuth = useCallback((): boolean => {
        if (!currentUser) {
            setIsAuthViewVisible(true);
            return false;
        }
        return true;
    }, [currentUser]);

    const handleLoginSuccess = useCallback((user: User) => {
        setCurrentUser(user);
        setIsAuthViewVisible(false);
    }, []);

    const handleLogout = useCallback(async () => {
        setIsAuthLoading(true);
        try {
            await authService.logOut();
            setCurrentUser(null);
            setActiveTab("today");
            localStorage.setItem(ACTIVE_TAB_KEY, "today");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    const handlePreferencesChange = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
        if (!currentUser) return;
        try {
            const updatedUser = await authService.updateNotificationPreferences(newPrefs);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to update preferences:", error);
        }
    }, [currentUser]);

    const handleAvatarChange = useCallback(async (base64Image: string) => {
        if (!requireAuth()) return;
        try {
            const updatedUser = await authService.updateAvatar(base64Image);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to update avatar:", error);
        }
    }, [requireAuth]);

    const handleEventCreated = useCallback(async (newEvent: Event) => {
        setEvents(prevEvents => [...prevEvents, newEvent]);
        setIsEventCreationVisible(false);

        if (!currentUser) {
            return;
        }
        try {
            const updatedUser = await authService.recordEventContribution();
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to record event contribution:", error);
        }
    }, [currentUser]);

    const handleCelebrationCreated = useCallback(async (newCelebration: Celebration) => {
        setCelebrations(prev => [...prev, newCelebration]);
        setActiveTab("today");
        localStorage.setItem(ACTIVE_TAB_KEY, "today");

        if (!currentUser) {
            return;
        }

        try {
            const updatedUser = await authService.recordCelebrationContribution();
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to record celebration contribution:", error);
        }
    }, [currentUser]);

    const handleToggleLike = useCallback(async (celebrationId: number) => {
        if (!requireAuth()) return;

        const isLiked = currentUser!.likedCelebrationIds.includes(celebrationId);
        const originalUser = currentUser!;
        const originalCelebrations = celebrations.map(c => ({ ...c }));

        setCurrentUser(prevUser => prevUser ? {
            ...prevUser,
            likedCelebrationIds: isLiked
                ? prevUser.likedCelebrationIds.filter(id => id !== celebrationId)
                : [...prevUser.likedCelebrationIds, celebrationId],
        } : prevUser);

        setCelebrations(prevCelebrations =>
            prevCelebrations.map(c =>
                c.id === celebrationId ? { ...c, likes: c.likes + (isLiked ? -1 : 1) } : c
            ));

        try {
            const updatedUser = await authService.toggleLikeStatus(celebrationId);
            setCurrentUser(updatedUser);
            await celebrationService.updateLikeCount(celebrationId, !isLiked);
        } catch (error) {
            console.error("Failed to toggle like:", error);
            setCelebrations(originalCelebrations);
            setCurrentUser(originalUser);
        }
    }, [celebrations, currentUser, requireAuth]);

    const handleToggleSave = useCallback(async (celebrationId: number) => {
        if (!requireAuth()) return;
        const isSaved = currentUser!.savedCelebrationIds.includes(celebrationId);
        const originalUser = currentUser!;

        setCurrentUser(prevUser => prevUser ? {
            ...prevUser,
            savedCelebrationIds: isSaved
                ? prevUser.savedCelebrationIds.filter(id => id !== celebrationId)
                : [...prevUser.savedCelebrationIds, celebrationId],
        } : prevUser);

        try {
            const updatedUser = await authService.toggleSaveStatus(celebrationId);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to toggle save:", error);
            setCurrentUser(originalUser);
        }
    }, [currentUser, requireAuth]);

    const handleToggleFollow = useCallback(async (targetUserId: string) => {
        if (!requireAuth()) return;
        if (currentUser!.id === targetUserId) {
            return;
        }

        const isFollowing = currentUser!.followingUserIds.includes(targetUserId);
        const originalUser = currentUser!;

        setCurrentUser(prevUser => prevUser ? {
            ...prevUser,
            followingUserIds: isFollowing
                ? prevUser.followingUserIds.filter(id => id !== targetUserId)
                : [...prevUser.followingUserIds, targetUserId],
        } : prevUser);

        try {
            const updatedUser = await authService.toggleFollowStatus(targetUserId);
            setCurrentUser(updatedUser);
        } catch (error) {
            console.error("Failed to toggle follow status:", error);
            setCurrentUser(originalUser);
        }
    }, [currentUser, requireAuth]);

    const handleRsvpToggle = useCallback(async (eventId: string) => {
        if (!requireAuth()) return;
        const isRsvped = currentUser!.rsvpedEventIds.includes(eventId);

        const originalUser = currentUser!;
        const originalEvents = events.map(event => ({ ...event, attendees: [...event.attendees] }));

        setCurrentUser(prevUser => prevUser ? {
            ...prevUser,
            rsvpedEventIds: isRsvped
                ? prevUser.rsvpedEventIds.filter(id => id !== eventId)
                : [...prevUser.rsvpedEventIds, eventId],
        } : prevUser);

        setEvents(prevEvents => prevEvents.map(e => {
            if (e.id !== eventId) return e;
            const attendees = isRsvped
                ? e.attendees.filter(a => a.userId !== currentUser!.id)
                : [...e.attendees, { userId: currentUser!.id, userName: currentUser!.name, avatarUrl: currentUser!.avatarUrl }];
            return { ...e, attendees, attendeeCount: attendees.length };
        }));

        setViewingEvent(prevEvent => {
            if (!prevEvent || prevEvent.id !== eventId) {
                return prevEvent;
            }
            const attendees = isRsvped
                ? prevEvent.attendees.filter(a => a.userId !== currentUser!.id)
                : [...prevEvent.attendees, { userId: currentUser!.id, userName: currentUser!.name, avatarUrl: currentUser!.avatarUrl }];
            return { ...prevEvent, attendees, attendeeCount: attendees.length };
        });

        try {
            const updatedUser = await authService.toggleRsvpStatus(eventId);
            setCurrentUser(updatedUser);
            await eventService.toggleRsvp(eventId, currentUser!);
        } catch (error) {
            console.error("Failed to toggle RSVP", error);
            setCurrentUser(originalUser);
            setEvents(originalEvents);
            setViewingEvent(originalEvents.find(e => e.id === eventId) || null);
        }
    }, [currentUser, events, requireAuth]);

    const handleSetTab = useCallback((tab: string) => {
        if (tab === "share" && !currentUser) {
            setIsAuthViewVisible(true);
            return;
        }
        setActiveTab(tab);
        localStorage.setItem(ACTIVE_TAB_KEY, tab);
    }, [currentUser]);

    const isMapView = activeTab === "today";

    const renderContent = () => {
        switch (activeTab) {
            case "today":
                return (
                    <DiscoveryView
                        specialDay={todaySpecialDay}
                        tomorrowSpecialDay={TOMORROW_SPECIAL_DAY}
                        celebrations={celebrations}
                        currentUser={currentUser}
                        onToggleLike={handleToggleLike}
                        onToggleSave={handleToggleSave}
                        onToggleFollow={handleToggleFollow}
                    />
                );
            case "share":
                return currentUser ? (
                    <CreateView
                        user={currentUser}
                        specialDay={todaySpecialDay}
                        onCelebrationCreated={handleCelebrationCreated}
                    />
                ) : null;
            case "connect":
                return (
                    <ConnectView
                        currentUser={currentUser}
                        onShowEventCreation={() => setIsEventCreationVisible(true)}
                        events={events}
                        onViewEvent={setViewingEvent}
                    />
                );
            case "profile":
                return (
                    <ProfileView
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        onShowAuth={() => setIsAuthViewVisible(true)}
                        onPreferencesChange={handlePreferencesChange}
                        onAvatarChange={handleAvatarChange}
                        celebrations={celebrations}
                        onShowMission={() => setIsMissionViewVisible(true)}
                        onNavigate={handleSetTab}
                    />
                );
            case "cms-test":
                return (
                    <div>
                        <div className="p-4 bg-surface">
                            <button
                                onClick={() => handleSetTab('profile')}
                                className="pill-button pill-muted mb-4"
                            >
                                ← Back to Profile
                            </button>
                        </div>
                        <CMSTest />
                    </div>
                );
            case "cms-admin":
                return <AdminDashboard />;
            default:
                return (
                    <DiscoveryView
                        specialDay={todaySpecialDay}
                        tomorrowSpecialDay={TOMORROW_SPECIAL_DAY}
                        celebrations={celebrations}
                        currentUser={currentUser}
                        onToggleLike={handleToggleLike}
                        onToggleSave={handleToggleSave}
                        onToggleFollow={handleToggleFollow}
                    />
                );
        }
    };

    if (isInitializing) {
        return (
            <div className="app-shell flex min-h-screen items-center justify-center">
                <div className="glass-panel px-10 py-12 text-center space-y-4">
                    <span className="section-heading">Woon</span>
                    <p className="text-heading text-2xl">Setting the stage for today's celebrations</p>
                    <LoadingSpinner className="mx-auto h-10 w-10 text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell flex min-h-screen flex-col">
            {isMapView && (
                <Header
                    isAuthLoading={isAuthLoading}
                    currentUser={currentUser}
                    setActiveTab={handleSetTab}
                    onShowAuth={() => setIsAuthViewVisible(true)}
                />
            )}
            <main className="relative flex-1 overflow-hidden">
                {isMapView ? (
                    renderContent()
                ) : (
                    <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 pb-28 pt-10 sm:px-6 lg:px-8">
                        {renderContent()}
                    </div>
                )}
            </main>
            <BottomNavBar activeTab={activeTab} setActiveTab={handleSetTab} isMapView={isMapView} />
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





