import React, { useState, useCallback, useEffect, useMemo } from "react";
import type mapboxgl from "mapbox-gl";
import type { SpecialDay, Celebration, User, FriendConnection } from "../types";
import { friendService } from "../services/friendService";
import { SimpleMap } from "./SimpleMap";
import { CelebrationDetailView } from "./CelebrationDetailView";
import { SearchIcon, HeartIcon, ChatBubbleLeftIcon, UsersIcon } from "./icons";
import { BottomSheet } from "./BottomSheet";
import { USER_LOCATION } from "../constants";

interface DiscoveryViewProps {
    specialDay: SpecialDay;
    tomorrowSpecialDay: SpecialDay;
    celebrations: Celebration[];
    currentUser: User | null;
    onToggleLike: (celebrationId: number) => void;
    onToggleSave: (celebrationId: number) => void;
    onToggleFollow: (userId: string) => void;
}

const TodaySpotlightCard: React.FC<{ specialDay: SpecialDay }> = ({ specialDay }) => (
    <div className="surface-elevated p-4 max-w-xs animate-slide-down">
        <div className="text-label">Today's special</div>
        <h2 className="text-heading mt-1">{specialDay.title}</h2>
        <p className="text-caption mt-2 line-clamp-2">{specialDay.description}</p>
    </div>
);

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...props }) => (
    <button
        {...props}
        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-surface-light/90 text-ink-700 shadow-brand transition hover:bg-primary/10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const MapUtilityStack: React.FC<{
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRecenter: () => void;
    disabled: boolean;
}> = ({ onZoomIn, onZoomOut, onRecenter, disabled }) => (
    <div className="flex flex-col rounded-2xl bg-surface-light/95 p-2 shadow-brand ring-1 ring-white/40 backdrop-blur">
        <IconButton onClick={onZoomIn} disabled={disabled} className="rounded-xl rounded-b-none border-b border-white/40">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
        </IconButton>
        <IconButton onClick={onZoomOut} disabled={disabled} className="rounded-none">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>
            </svg>
        </IconButton>
        <IconButton onClick={onRecenter} disabled={disabled} className="rounded-xl rounded-t-none">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path d="M229.33,98.21,53.41,33a16,16,0,0,0-20.51,19.89l65.21,175.92A16,16,0,0,0,128,232h.21a16,16,0,0,0,15-11.29l23.56-76.56,76.56-23.56a16,16,0,0,0,.62-30.38ZM224,113.3l-76.56,23.56a16,16,0,0,0-10.58,10.58L113.3,224h0L48,48l175.82,65.22Z"></path>
            </svg>
        </IconButton>
    </div>
);

const FloatingHeader: React.FC<{
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onToggleFriendsLayer: () => void;
    showFriendsLayer: boolean;
}> = ({ searchQuery, onSearchChange, onToggleFriendsLayer, showFriendsLayer }) => (
    <div className="absolute inset-x-0 top-20 z-10 px-6">
        <div className="flex gap-3 items-center animate-slide-down">
            <div className="surface-elevated flex-1 flex items-center gap-3 px-4 py-3">
                <SearchIcon className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search celebrations..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input flex-1 border-0 bg-transparent p-0 focus:ring-0"
                />
            </div>
            <button
                type="button"
                onClick={onToggleFriendsLayer}
                className={`btn btn-sm ${showFriendsLayer ? 'btn-primary' : 'btn-secondary'}`}
            >
                <UsersIcon className="w-4 h-4" />
                Friends
            </button>
        </div>
    </div>
);

const CelebrationCard: React.FC<{
    celebration: Celebration;
    isSaved: boolean;
    onClick: () => void;
}> = ({ celebration, isSaved, onClick }) => (
    <button
        onClick={onClick}
        type="button"
        className="card w-full p-0 text-left transition-all hover:scale-[1.02] hover:shadow-lg"
    >
        <div className="flex items-center gap-4 p-4">
            <img
                src={celebration.imageUrl}
                alt={celebration.title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <h3 className="text-title truncate">{celebration.title}</h3>
                <p className="text-caption">by {celebration.author}</p>
                <div className="flex items-center gap-3 mt-2">
                    <div className="chip">
                        <HeartIcon className="w-4 h-4" />
                        {celebration.likes}
                    </div>
                    <div className="chip">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        {celebration.commentCount}
                    </div>
                    {isSaved && (
                        <div className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-medium">
                            Saved
                        </div>
                    )}
                </div>
            </div>
        </div>
    </button>
);

const TomorrowCard: React.FC<{ tomorrowSpecialDay: SpecialDay }> = ({ tomorrowSpecialDay }) => (
    <div className="p-6 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-xl">
        <div className="text-label text-white/80">Tomorrow</div>
        <h3 className="text-heading text-white mt-1">{tomorrowSpecialDay.title}</h3>
        <p className="text-body text-white/90 mt-2 line-clamp-2">{tomorrowSpecialDay.description}</p>
    </div>
);

const FriendCard: React.FC<{
    friend: FriendConnection;
    isFollowing: boolean;
    onFollowToggle: (friendId: string) => void;
}> = ({ friend, isFollowing, onFollowToggle }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <img src={friend.avatarUrl} alt={friend.name} className="h-14 w-14 rounded-xl object-cover" />
            <div>
                <h3 className="text-lg font-semibold text-ink-900">{friend.name}</h3>
                <p className="text-sm text-ink-500">{friend.celebrationMessage}</p>
            </div>
        </div>
        <button
            type="button"
            onClick={() => onFollowToggle(friend.id)}
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
                isFollowing ? "bg-ink-200 text-ink-700" : "bg-primary text-white"
            }`}
        >
            {isFollowing ? "Following" : "Follow"}
        </button>
    </div>
);

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({
    specialDay,
    tomorrowSpecialDay,
    celebrations,
    currentUser,
    onToggleLike,
    onToggleSave,
    onToggleFollow,
}) => {
    const [selectedCelebration, setSelectedCelebration] = useState<Celebration | null>(null);
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
    const [friends, setFriends] = useState<FriendConnection[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [showFriendsLayer, setShowFriendsLayer] = useState(true);
    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

    const bookmarkedIds = currentUser?.savedCelebrationIds ?? [];
    const followingIds = currentUser?.followingUserIds ?? [];

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(searchInput.trim().toLowerCase());
        }, 250);
        return () => window.clearTimeout(timeoutId);
    }, [searchInput]);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            const connections = await friendService.getConnectionsForUser(currentUser ?? null);
            if (isMounted) {
                setFriends(connections);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, [currentUser]);

    useEffect(() => {
        if (selectedCelebration && debouncedQuery) {
            const isSelectedVisible = celebrations.some(c =>
                c.id === selectedCelebration.id &&
                (c.title.toLowerCase().includes(debouncedQuery) || c.author.toLowerCase().includes(debouncedQuery))
            );
            if (!isSelectedVisible) {
                setSelectedCelebration(null);
            }
        }
    }, [debouncedQuery, celebrations, selectedCelebration]);

    const handleSelectCelebration = useCallback((celebration: Celebration | null) => {
        setSelectedFriendId(null);
        setSelectedCelebration(celebration);
    }, []);

    const handleSelectFriend = useCallback((friendId: string | null) => {
        if (friendId) {
            setSelectedCelebration(null);
        }
        setSelectedFriendId(friendId);
    }, []);

    const filteredCelebrations = useMemo(() => {
        if (!debouncedQuery) return celebrations;
        return celebrations.filter(c =>
            c.title.toLowerCase().includes(debouncedQuery) ||
            c.author.toLowerCase().includes(debouncedQuery)
        );
    }, [celebrations, debouncedQuery]);

    const selectedFriend = selectedFriendId ? friends.find(friend => friend.id === selectedFriendId) ?? null : null;

    const handleSheetStateChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedCelebration(null);
            setSelectedFriendId(null);
        }
    };

    const handleZoom = useCallback((direction: "in" | "out") => {
        if (!mapInstance) return;
        if (direction === "in") {
            mapInstance.zoomIn({ duration: 350 });
        } else {
            mapInstance.zoomOut({ duration: 350 });
        }
    }, [mapInstance]);

    const handleRecenter = useCallback(() => {
        if (!mapInstance) return;
        mapInstance.flyTo({
            center: [USER_LOCATION.lng, USER_LOCATION.lat],
            zoom: 12,
            pitch: 45,
            duration: 1200,
        });
    }, [mapInstance]);

    return (
        <div className="relative h-full w-full">
            <SimpleMap
                celebrations={filteredCelebrations}
                selectedCelebrationId={selectedCelebration?.id ?? null}
                onSelectCelebration={(id) => handleSelectCelebration(id ? filteredCelebrations.find(c => c.id === id) ?? null : null)}
                friends={friends}
                showFriendsLayer={showFriendsLayer}
                onSelectFriend={handleSelectFriend}
                highlightedFriendId={selectedFriendId}
                onMapReady={setMapInstance}
            />
            <FloatingHeader
                searchQuery={searchInput}
                onSearchChange={setSearchInput}
                onToggleFriendsLayer={() => setShowFriendsLayer(prev => !prev)}
                showFriendsLayer={showFriendsLayer}
            />
            <div className="pointer-events-none absolute bottom-[11rem] left-4 right-4 flex justify-between gap-4 sm:left-6 sm:right-6 md:left-1/2 md:right-auto md:w-full md:max-w-3xl md:-translate-x-1/2">
                <div className="pointer-events-auto"><TodaySpotlightCard specialDay={specialDay} /></div>
                <div className="pointer-events-auto"><MapUtilityStack onZoomIn={() => handleZoom("in")} onZoomOut={() => handleZoom("out")} onRecenter={handleRecenter} disabled={!mapInstance} /></div>
            </div>
            <BottomSheet isOpen={!!selectedCelebration || !!selectedFriend} onStateChange={handleSheetStateChange}>
                {selectedCelebration ? (
                    <CelebrationDetailView
                        celebration={selectedCelebration}
                        currentUser={currentUser}
                        onBack={() => handleSelectCelebration(null)}
                        onToggleLike={onToggleLike}
                        onToggleSave={onToggleSave}
                        onToggleFollow={onToggleFollow}
                    />
                ) : selectedFriend ? (
                    <FriendCard
                        friend={selectedFriend}
                        isFollowing={followingIds.includes(selectedFriend.id)}
                        onFollowToggle={onToggleFollow}
                    />
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-ink-900">Nearby celebrations</h3>
                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink-400">{filteredCelebrations.length} spots</span>
                        </div>
                        <div className="space-y-4">
                            {filteredCelebrations.map(c => (
                                <CelebrationCard
                                    key={c.id}
                                    celebration={c}
                                    isSaved={bookmarkedIds.includes(c.id)}
                                    onClick={() => handleSelectCelebration(c)}
                                />
                            ))}
                        </div>
                        <TomorrowCard tomorrowSpecialDay={tomorrowSpecialDay} />
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};
