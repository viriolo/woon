import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Celebration, Event, SpecialDay, User } from "../../types";
import { useAuth } from "../contexts/AuthContext";
import { BottomNav, type TabKey } from "./components/BottomNav";
import { AppHeader } from "./components/AppHeader";
import { TodayView } from "../features/today/TodayView";
import type { TodaySheetMode, TodaySheetState } from "../features/today/types";
import { ShareView } from "../features/share/ShareView";
import { ConnectView } from "../features/connect/ConnectView";
import { ProfileView } from "../features/profile/ProfileView";
import AuthView from "../components/AuthView";
import { useUserLocation } from "../hooks/useUserLocation";
import { specialDayService } from "../services/specialDayService";
import { celebrationService } from "../../services/celebrationService";
import { commentService } from "../../services/commentService";
import { eventService } from "../../services/eventService";
import { CELEBRATIONS } from "../../constants";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { offlineQueue, type OfflineActionInput, type OfflineAction } from "../utils/offlineQueue";
import { dataUrlToFile } from "../utils/file";
import { MediaService } from "../lib/cms";
import { formatRelativeTime } from "../utils/time";

const ACTIVE_TAB_KEY = "woon-active-tab";
const OFFLINE_CELEBRATIONS_KEY = "woon-offline-celebrations";
const LAST_UPDATED_KEY = "woon-last-updated";
const OFFLINE_COMMENT_SYNC_EVENT = "woon-offline-comment-synced";

const initialSheetState: TodaySheetState = { isOpen: true, mode: "preview" };

const buildUserFromSnapshot = (snapshot: { id: string; name: string; email: string; avatarUrl?: string }): User => ({
  id: snapshot.id,
  name: snapshot.name,
  email: snapshot.email,
  avatarUrl: snapshot.avatarUrl,
  handle: undefined,
  bio: "",
  location: "",
  notificationPreferences: { dailySpecialDay: true, communityActivity: true },
  likedCelebrationIds: [],
  savedCelebrationIds: [],
  rsvpedEventIds: [],
  followingUserIds: [],
  followerUserIds: [],
  followingCount: 0,
  followersCount: 0,
  streakDays: 0,
  experiencePoints: 0,
  achievements: [],
  level: 1,
});

export const AppShell: React.FC = () => {
  const {
    user,
    loading: authLoading,
    toggleLikeStatus,
    toggleSaveStatus,
    toggleRsvpStatus,
    logOut,
  } = useAuth();
  const {
    location,
    loading: locationLoading,
    error: locationError,
    requestLocation,
  } = useUserLocation();
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_TAB_KEY) : null;
    if (stored === "share" || stored === "connect" || stored === "profile") {
      return stored;
    }
    return "today";
  });
  const [specialDay, setSpecialDay] = useState<SpecialDay>(() => specialDayService.getToday());
  const [tomorrowSpecialDay, setTomorrowSpecialDay] = useState<SpecialDay>(() => specialDayService.getTomorrow());
  const [celebrations, setCelebrations] = useState<Celebration[]>(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(OFFLINE_CELEBRATIONS_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as Celebration[];
        } catch (error) {
          console.warn("Failed to parse cached celebrations", error);
        }
      }
    }
    return CELEBRATIONS;
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCelebration, setSelectedCelebration] = useState<Celebration | null>(null);
  const [sheetState, setSheetState] = useState<TodaySheetState>(initialSheetState);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptLabel, setAuthPromptLabel] = useState<string | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [celebrationsLoading, setCelebrationsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => offlineQueue.getAll().length);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(LAST_UPDATED_KEY);
    return stored ? Number(stored) : null;
  });

  const updateLastUpdated = useCallback((timestamp: number) => {
    setLastUpdatedAt(timestamp);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_UPDATED_KEY, String(timestamp));
    }
  }, []);

  const ensureStorageConsent = useCallback(() => {
    if (typeof window === "undefined") return true;
    const consentKey = "woon-storage-consent";
    const existing = window.localStorage.getItem(consentKey);
    if (existing) {
      return true;
    }
    const proceed = window.confirm(
      "Woon stores pending posts on your device so we can sync them once you're back online. Continue?"
    );
    if (proceed) {
      window.localStorage.setItem(consentKey, "granted");
    }
    return proceed;
  }, []);

  const ensureLocationAccess = useCallback(async () => {
    if (typeof window !== "undefined") {
      const key = "woon-location-prompt";
      const alreadyShown = window.localStorage.getItem(key);
      if (!alreadyShown) {
        const proceed = window.confirm(
          "Woon uses your location to place celebrations on the map and surface nearby events. Allow access?"
        );
        window.localStorage.setItem(key, "shown");
        if (!proceed) {
          return false;
        }
      }
    }
    return requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    setSpecialDay(specialDayService.getToday());
    setTomorrowSpecialDay(specialDayService.getTomorrow());
  }, []);

  useEffect(() => {
    if (user) {
      setHasUnreadNotifications(true);
    } else {
      setHasUnreadNotifications(false);
    }
  }, [user]);

  useEffect(() => {
    const loadCelebrations = async () => {
      try {
        setCelebrationsLoading(true);
        const fetched = await celebrationService.getCelebrations();
        if (fetched.length) {
          setCelebrations(fetched);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(OFFLINE_CELEBRATIONS_KEY, JSON.stringify(fetched));
          }
          updateLastUpdated(Date.now());
        }
      } catch (error) {
        console.error("Failed to load celebrations", error);
        const cached = typeof window !== "undefined" ? window.localStorage.getItem(OFFLINE_CELEBRATIONS_KEY) : null;
        if (cached) {
          try {
            setCelebrations(JSON.parse(cached) as Celebration[]);
          } catch (parseError) {
            console.warn("Failed to read cached celebrations", parseError);
          }
        }
        setErrorMessage("We couldn't load celebrations. Showing recent highlights instead.");
      } finally {
        setCelebrationsLoading(false);
      }
    };

    loadCelebrations();

    const subscription = celebrationService.subscribeToNewCelebrations((freshCelebration) => {
      setCelebrations((prev) => {
        const exists = prev.some((item) => item.id === freshCelebration.id);
        if (exists) return prev;
        const updated = [freshCelebration, ...prev];
        if (typeof window !== "undefined") {
          window.localStorage.setItem(OFFLINE_CELEBRATIONS_KEY, JSON.stringify(updated));
        }
        return updated;
      });
      setHasUnreadNotifications(true);
      updateLastUpdated(Date.now());
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [updateLastUpdated]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        const fetched = await eventService.getEvents();
        setEvents(fetched);
      } catch (error) {
        console.error("Failed to load events", error);
        setErrorMessage((prev) => prev ?? "We couldn't load community events right now.");
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();

    const subscription = eventService.subscribeToEvents((incomingEvent) => {
      setEvents((prev) => {
        const exists = prev.some((eventItem) => eventItem.id === incomingEvent.id);
        if (exists) {
          return prev.map((eventItem) => (eventItem.id === incomingEvent.id ? incomingEvent : eventItem));
        }
        return [incomingEvent, ...prev];
      });
      setHasUnreadNotifications(true);
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (user && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setIsAuthPromptOpen(false);
      setAuthPromptLabel(null);
      action();
    }
  }, [user]);

  const enqueueOfflineAction = useCallback(
    (action: OfflineActionInput): OfflineAction | null => {
      if (!ensureStorageConsent()) {
        return null;
      }
      const entry = offlineQueue.enqueue(action);
      setPendingQueueCount(offlineQueue.getAll().length);
      setHasUnreadNotifications(true);
      return entry;
    },
    [ensureStorageConsent]
  );

  const processOfflineQueue = useCallback(async () => {
    if (!isOnline) {
      return;
    }
    const queued = offlineQueue.getAll();
    if (!queued.length) {
      setPendingQueueCount(0);
      return;
    }

    for (const action of queued) {
      try {
        if (action.type === "comment") {
          if (!user || user.id !== action.payload.userSnapshot.id) {
            continue;
          }
          const posted = await commentService.addComment(
            action.payload.celebrationId,
            action.payload.text,
            buildUserFromSnapshot(action.payload.userSnapshot)
          );
          offlineQueue.remove(action.id);
          window.dispatchEvent(
            new CustomEvent(OFFLINE_COMMENT_SYNC_EVENT, {
              detail: {
                offlineId: action.id,
                celebrationId: action.payload.celebrationId,
                comment: posted,
              },
            })
          );
        } else if (action.type === "celebration") {
          if (!user || user.id !== action.payload.userId) {
            continue;
          }
          const file = await dataUrlToFile(
            action.payload.celebrationData.imageDataUrl,
            `offline-${Date.now()}.jpg`
          );
          const media = await MediaService.uploadFile(file);
          const created = await celebrationService.createCelebration(
            {
              title: action.payload.celebrationData.title,
              description: action.payload.celebrationData.description,
              imageUrl: media.storage_path,
            },
            { id: action.payload.userId },
            action.payload.location
          );
          setCelebrations((prev) => {
            const updated = [created, ...prev];
            if (typeof window !== "undefined") {
              window.localStorage.setItem(OFFLINE_CELEBRATIONS_KEY, JSON.stringify(updated));
            }
            return updated;
          });
          offlineQueue.remove(action.id);
          updateLastUpdated(Date.now());
        }
      } catch (error) {
        console.error("Failed to process offline action", error);
      }
    }

    setPendingQueueCount(offlineQueue.getAll().length);
  }, [isOnline, updateLastUpdated, user]);

  useEffect(() => {
    processOfflineQueue();
  }, [processOfflineQueue]);

  const requireAuth = useCallback(
    (message: string, action?: () => void) => {
      if (!user) {
        setAuthPromptLabel(message);
        setIsAuthPromptOpen(true);
        if (action) {
          pendingActionRef.current = action;
        }
        if (navigator.vibrate) {
          navigator.vibrate(8);
        }
        return false;
      }
      return true;
    },
    [user]
  );

  const handleSelectCelebration = useCallback((celebration: Celebration | null, mode: TodaySheetMode = "detail") => {
    setSelectedCelebration(celebration);
    setSheetState({ isOpen: !!celebration, mode: celebration ? mode : "preview" });
    if (celebration) {
      setActiveTab("today");
      setIsSearchOverlayOpen(false);
    }
  }, []);

  const handleCreateEvent = useCallback((newEvent: Event) => {
    setEvents((prev) => [newEvent, ...prev]);
    setHasUnreadNotifications(true);
  }, []);

  const filteredCelebrations = useMemo(() => {
    if (!searchTerm.trim()) {
      return celebrations;
    }
    const lower = searchTerm.toLowerCase();
    return celebrations.filter((celebration) =>
      [celebration.title, celebration.description, celebration.author]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lower))
    );
  }, [celebrations, searchTerm]);

  const handleToggleLike = useCallback(
    (celebration: Celebration) => {
      const wasLiked = Boolean(user?.likedCelebrationIds.includes(celebration.id));
      const run = async () => {
        try {
          await toggleLikeStatus(celebration.id.toString());
          setCelebrations((prev) =>
            prev.map((item) =>
              item.id === celebration.id
                ? {
                    ...item,
                    likes: Math.max(0, item.likes + (wasLiked ? -1 : 1)),
                  }
                : item
            )
          );
          setSelectedCelebration((prev) =>
            prev && prev.id === celebration.id
              ? { ...prev, likes: Math.max(0, prev.likes + (wasLiked ? -1 : 1)) }
              : prev
          );
          if (navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch (error) {
          console.error("Unable to update like state", error);
        }
      };

      if (!requireAuth("Sign in to appreciate celebrations", run)) {
        return;
      }

      void run();
    },
    [toggleLikeStatus, user, requireAuth]
  );

  const handleToggleSave = useCallback(
    (celebration: Celebration) => {
      const run = async () => {
        try {
          await toggleSaveStatus(celebration.id.toString());
          if (navigator.vibrate) {
            navigator.vibrate(8);
          }
        } catch (error) {
          console.error("Unable to update save state", error);
        }
      };

      if (!requireAuth("Sign in to save celebrations", run)) {
        return;
      }

      void run();
    },
    [toggleSaveStatus, requireAuth]
  );

  const handleAuthClose = useCallback(() => {
    setIsAuthPromptOpen(false);
    setAuthPromptLabel(null);
    pendingActionRef.current = null;
  }, []);

  const handleSignOut = useCallback(async () => {
    await logOut();
    setActiveTab("today");
    setSelectedCelebration(null);
    setSheetState(initialSheetState);
    setHasUnreadNotifications(false);
  }, [logOut]);

  const todayView = (
    <TodayView
      specialDay={specialDay}
      tomorrowSpecialDay={tomorrowSpecialDay}
      celebrations={filteredCelebrations}
      isLoading={celebrationsLoading}
      errorMessage={errorMessage}
      location={location}
      locationLoading={locationLoading}
      locationError={locationError}
      onRequestLocation={ensureLocationAccess}
      onSelectCelebration={handleSelectCelebration}
      selectedCelebration={selectedCelebration}
      sheetState={sheetState}
      onSheetStateChange={setSheetState}
      onToggleLike={handleToggleLike}
      onToggleSave={handleToggleSave}
      requireAuth={requireAuth}
      isGuest={!user}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      isSearchOpen={isSearchOverlayOpen}
      onCloseSearch={() => setIsSearchOverlayOpen(false)}
      isOnline={isOnline}
      enqueueOfflineAction={enqueueOfflineAction}
    />
  );

  const shareView = (
    <ShareView
      onCelebrationCreated={(createdCelebration) => {
        setCelebrations((prev) => {
          const updated = [createdCelebration, ...prev];
          if (typeof window !== "undefined") {
            window.localStorage.setItem(OFFLINE_CELEBRATIONS_KEY, JSON.stringify(updated));
          }
          return updated;
        });
        setActiveTab("today");
        handleSelectCelebration(createdCelebration, "detail");
        setHasUnreadNotifications(true);
        updateLastUpdated(Date.now());
      }}
      currentUser={user}
      requireAuth={requireAuth}
      location={location}
      locationError={locationError}
      requestLocation={ensureLocationAccess}
      isOnline={isOnline}
      enqueueOfflineAction={enqueueOfflineAction}
    />
  );

  const connectView = (
    <ConnectView
      events={events}
      loading={eventsLoading}
      location={location}
      currentUser={user}
      requireAuth={requireAuth}
      onEventCreated={handleCreateEvent}
      onToggleRsvp={async (eventId) => {
        if (!requireAuth("Sign in to RSVP", () => {})) {
          return;
        }
        if (!user) return;
        const updated = await eventService.toggleRsvp(eventId, user.id);
        await toggleRsvpStatus(eventId);
        setEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        if (navigator.vibrate) {
          navigator.vibrate(12);
        }
      }}
    />
  );

  const profileView = (
    <ProfileView
      user={user}
      celebrations={celebrations}
      onSignOut={handleSignOut}
      onSelectCelebration={(celebration) => {
        handleSelectCelebration(celebration, "detail");
        setActiveTab("today");
      }}
      requireAuth={requireAuth}
    />
  );

  const lastUpdatedLabel = lastUpdatedAt ? formatRelativeTime(lastUpdatedAt) : null;

  return (
    <div className="app-shell">
      <AppHeader
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab !== "today") {
            setIsSearchOverlayOpen(false);
          }
        }}
        onOpenSearch={() => {
          if (activeTab !== "today") {
            setActiveTab("today");
          }
          setIsSearchOverlayOpen(true);
        }}
        onOpenNotifications={() => {
          if (!user) {
            requireAuth("Sign in to see notifications");
            return;
          }
          setHasUnreadNotifications(false);
        }}
        hasUnreadNotifications={hasUnreadNotifications || pendingQueueCount > 0}
        isLoggedIn={Boolean(user)}
        isOnline={isOnline}
        lastUpdatedLabel={lastUpdatedLabel}
        pendingQueueCount={pendingQueueCount}
      />

      <main className="app-shell__content">
        {activeTab === "today" && todayView}
        {activeTab === "share" && shareView}
        {activeTab === "connect" && connectView}
        {activeTab === "profile" && profileView}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          if (tab !== "today") {
            setIsSearchOverlayOpen(false);
          }
        }}
      />

      {isAuthPromptOpen && (
        <AuthView onClose={handleAuthClose} prompt={authPromptLabel ?? undefined} />
      )}

      {authLoading && !user && (
        <div className="loading-overlay">
          <div className="loading-overlay__content">Signing you in…</div>
        </div>
      )}
    </div>
  );
};
