import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "./components/Header";
import { BottomNavBar } from "./components/BottomNavBar";
import { DiscoveryView } from "./components/DiscoveryView";
import { CreateView } from "./components/CreateView";
import { ConnectView } from "./components/ConnectView";
import UserProfileView from "./src/components/UserProfileView";
import AuthView from "./src/components/AuthView";
import { EventCreationView } from "./components/EventCreationView";
import { EventDetailView } from "./components/EventDetailView";
import { MissionView } from "./components/MissionView";
import CMSTest from "./src/components/CMSTest";
import AdminDashboard from "./src/components/admin/AdminDashboard";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import type { Event, Celebration } from "./types";
import {
    TODAY_SPECIAL_DAY as MOCK_TODAY_SPECIAL_DAY,
    TOMORROW_SPECIAL_DAY,
    CELEBRATIONS as MOCK_CELEBRATIONS,
} from "./constants";
import { LoadingSpinner } from "./components/icons";
import { eventService } from "./services/eventService";
import { celebrationService } from "./services/celebrationService";

const ACTIVE_TAB_KEY = "woon-active-tab";

const AppContent: React.FC = () => {
    console.log('App component is loading...');
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState(() => {
        const stored = localStorage.getItem(ACTIVE_TAB_KEY);
        return stored === "share" ? "today" : stored || "today";
    });
    const [isAuthViewVisible, setIsAuthViewVisible] = useState(false);
    const [isEventCreationVisible, setIsEventCreationVisible] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [celebrations, setCelebrations] = useState<Celebration[]>([]);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [isMissionViewVisible, setIsMissionViewVisible] = useState(false);

    const updateActiveTab = useCallback((tab: string) => {
        setActiveTab(tab);
        localStorage.setItem(ACTIVE_TAB_KEY, tab);
    }, [setActiveTab]);

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
                const storedEvents = await eventService.getEvents();
                setEvents(storedEvents);

                const storedCelebrations = await celebrationService.getCelebrations();
                setCelebrations([...MOCK_CELEBRATIONS, ...storedCelebrations]);
            } catch (error) {
                console.error("Initialization failed:", error);
            }
        };

        initializeApp();
    }, []);

    const requireAuth = useCallback((): boolean => {
        if (!user) {
            setIsAuthViewVisible(true);
            return false;
        }
        return true;
    }, [user]);

    const {
        recordEventContribution,
        recordCelebrationContribution,
        toggleLikeStatus,
        toggleSaveStatus,
        toggleFollowStatus,
        toggleRsvpStatus
    } = useAuth();

    const handleAuthClose = useCallback(() => {
        setIsAuthViewVisible(false);
    }, []);

    // Auto-close auth modal when user successfully logs in
    useEffect(() => {
        if (user && isAuthViewVisible) {
            setIsAuthViewVisible(false);
        }
    }, [user, isAuthViewVisible]);

    useEffect(() => {
        if (!user && activeTab === "share") {
            updateActiveTab("today");
        }
    }, [user, activeTab, updateActiveTab]);

    const handleEventCreated = useCallback(async (newEvent: Event) => {
        setEvents(prevEvents => [...prevEvents, newEvent]);
        setIsEventCreationVisible(false);

        if (user) {
            try {
                await recordEventContribution();
            } catch (error) {
                console.error("Failed to record event contribution:", error);
            }
        }
    }, [user, recordEventContribution]);

    const handleCelebrationCreated = useCallback(async (newCelebration: Celebration) => {
        setCelebrations(prev => [...prev, newCelebration]);
        updateActiveTab("today");

        if (user) {
            try {
                await recordCelebrationContribution();
            } catch (error) {
                console.error("Failed to record celebration contribution:", error);
            }
        }
    }, [user, recordCelebrationContribution, updateActiveTab]);

    const handleToggleLike = useCallback(async (celebrationId: number) => {
        if (!requireAuth()) return;

        const isLiked = user!.likedCelebrationIds.includes(celebrationId);
        const originalCelebrations = celebrations.map(c => ({ ...c }));

        setCelebrations(prevCelebrations =>
            prevCelebrations.map(c =>
                c.id === celebrationId ? { ...c, likes: c.likes + (isLiked ? -1 : 1) } : c
            ));

        try {
            await toggleLikeStatus(celebrationId.toString());
            await celebrationService.updateLikeCount(celebrationId, !isLiked);
        } catch (error) {
            console.error("Failed to toggle like:", error);
            setCelebrations(originalCelebrations);
        }
    }, [celebrations, user, requireAuth, toggleLikeStatus]);

    const handleToggleSave = useCallback(async (celebrationId: number) => {
        if (!requireAuth()) return;

        try {
            await toggleSaveStatus(celebrationId.toString());
        } catch (error) {
            console.error("Failed to toggle save:", error);
        }
    }, [requireAuth, toggleSaveStatus]);

    const handleToggleFollow = useCallback(async (targetUserId: string) => {
        if (!requireAuth()) return;
        if (user!.id === targetUserId) {
            return;
        }

        try {
            await toggleFollowStatus(targetUserId);
        } catch (error) {
            console.error("Failed to toggle follow status:", error);
        }
    }, [user, requireAuth, toggleFollowStatus]);

    const handleRsvpToggle = useCallback(async (eventId: string) => {
        if (!requireAuth()) return;

        const isRsvped = user!.rsvpedEventIds.includes(eventId);
        const originalEvents = events.map(event => ({ ...event, attendees: [...event.attendees] }));

        setEvents(prevEvents => prevEvents.map(e => {
            if (e.id !== eventId) return e;
            const attendees = isRsvped
                ? e.attendees.filter(a => a.userId !== user!.id)
                : [...e.attendees, { userId: user!.id, userName: user!.name, avatarUrl: user!.avatarUrl }];
            return { ...e, attendees, attendeeCount: attendees.length };
        }));

        setViewingEvent(prevEvent => {
            if (!prevEvent || prevEvent.id !== eventId) {
                return prevEvent;
            }
            const attendees = isRsvped
                ? prevEvent.attendees.filter(a => a.userId !== user!.id)
                : [...prevEvent.attendees, { userId: user!.id, userName: user!.name, avatarUrl: user!.avatarUrl }];
            return { ...prevEvent, attendees, attendeeCount: attendees.length };
        });

        try {
            await toggleRsvpStatus(eventId);
            await eventService.toggleRsvp(eventId, user!);
        } catch (error) {
            console.error("Failed to toggle RSVP", error);
            setEvents(originalEvents);
            setViewingEvent(originalEvents.find(e => e.id === eventId) || null);
        }
    }, [user, events, requireAuth, toggleRsvpStatus]);

    const handleSetTab = useCallback((tab: string) => {
        if (tab === "share" && !user) {
            setIsAuthViewVisible(true);
            return;
        }
        updateActiveTab(tab);
    }, [user]);

    const isMapView = activeTab === "today";

    const renderContent = () => {
        switch (activeTab) {
            case "today":
                return (
                    <DiscoveryView
                        specialDay={todaySpecialDay}
                        tomorrowSpecialDay={TOMORROW_SPECIAL_DAY}
                        celebrations={celebrations}
                        currentUser={user}
                        onToggleLike={handleToggleLike}
                        onToggleSave={handleToggleSave}
                        onToggleFollow={handleToggleFollow}
                    />
                );
            case "share":
                return user ? (
                    <CreateView
                        user={user}
                        specialDay={todaySpecialDay}
                        onCelebrationCreated={handleCelebrationCreated}
                    />
                ) : null;
            case "connect":
                return (
                    <ConnectView
                        currentUser={user}
                        onShowEventCreation={() => setIsEventCreationVisible(true)}
                        events={events}
                        onViewEvent={setViewingEvent}
                    />
                );
            case "profile":
                return (
                    <UserProfileView
                        onNavigate={handleSetTab}
                        onShowMission={() => setIsMissionViewVisible(true)}
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
                                Back to Profile
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
                        currentUser={user}
                        onToggleLike={handleToggleLike}
                        onToggleSave={handleToggleSave}
                        onToggleFollow={handleToggleFollow}
                    />
                );
        }
    };

    if (loading) {
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
                    isAuthLoading={loading}
                    currentUser={user}
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
                <AuthView onClose={handleAuthClose} />
            )}
            {isEventCreationVisible && user && (
                <EventCreationView
                    user={user}
                    onClose={() => setIsEventCreationVisible(false)}
                    onEventCreated={handleEventCreated}
                />
            )}
            {viewingEvent && (
                <EventDetailView
                    event={viewingEvent}
                    currentUser={user}
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

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
