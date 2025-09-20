import React, { useState, useCallback, useEffect, useMemo } from "react";
import type { SpecialDay, Celebration, User, FriendConnection } from "../types";
import { friendService } from "../services/friendService";
import { InteractiveMap } from "./InteractiveMap";
import { CelebrationDetailView } from "./CelebrationDetailView";
import { SearchIcon, HeartIcon, ChatBubbleLeftIcon, UsersIcon } from "./icons";
import { BottomSheet } from "./BottomSheet";

interface DiscoveryViewProps {
    specialDay: SpecialDay;
    tomorrowSpecialDay: SpecialDay;
    celebrations: Celebration[];
    currentUser: User | null;
    onToggleLike: (celebrationId: number) => void;
    onToggleSave: (celebrationId: number) => void;
    onToggleFollow: (userId: string) => void;
}

const SpecialDayBadge: React.FC<{ specialDay: SpecialDay }> = ({ specialDay }) => (
    <div className="inline-block bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-md">
        <span className="font-bold text-neutral-800">{specialDay.title}</span>
        <span className="mx-2 text-neutral-400">&bull;</span>
        <span className="font-medium text-special-primary">{specialDay.date}</span>
    </div>
);

const FloatingHeader: React.FC<{
    specialDay: SpecialDay;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onToggleFriendsLayer: () => void;
    showFriendsLayer: boolean;
}> = ({ specialDay, searchQuery, onSearchChange, onToggleFriendsLayer, showFriendsLayer }) => (
    <div className="absolute top-4 left-0 right-0 px-4 z-10 flex flex-col items-center gap-3 pointer-events-none">
        <div className="pointer-events-auto">
            <SpecialDayBadge specialDay={specialDay} />
        </div>
        <div className="w-full max-w-md mx-auto relative pointer-events-auto flex gap-2">
            <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                    type="text"
                    placeholder="Search celebrations..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-md border border-neutral-200/50 rounded-full shadow-md placeholder-neutral-500 focus:ring-2 focus:ring-special-primary focus:outline-none transition"
                />
            </div>
            <button
                onClick={onToggleFriendsLayer}
                className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-colors ${
                    showFriendsLayer ? "bg-special-primary text-white border-special-primary" : "bg-white/90 text-neutral-700 border-neutral-200"
                }`}
            >
                <UsersIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Nearby</span>
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
        className="w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 bg-white/70 hover:bg-white hover:shadow-lg hover:scale-[1.02]"
    >
        <img src={celebration.imageUrl} alt={celebration.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
        <div className="flex-grow overflow-hidden text-left">
            <h3 className="font-bold text-neutral-800 truncate">{celebration.title}</h3>
            <p className="text-sm text-neutral-600">by {celebration.author}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-4 text-sm text-neutral-600">
             <div className="flex items-center gap-1">
                <HeartIcon className="w-5 h-5 text-neutral-400" />
                <span>{celebration.likes}</span>
            </div>
             <div className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-5 h-5 text-neutral-400" />
                <span>{celebration.commentCount}</span>
            </div>
             {isSaved && (
                <span className="text-xs font-semibold text-special-primary">Saved</span>
             )}
        </div>
    </button>
);

const TomorrowCard: React.FC<{ tomorrowSpecialDay: SpecialDay }> = ({ tomorrowSpecialDay }) => (
    <div className="w-full rounded-xl p-4 bg-neutral-800 text-white">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">Tomorrow</h3>
        <p className="text-lg font-bold text-white">{tomorrowSpecialDay.title}</p>
        <p className="text-sm opacity-80 mt-1">{tomorrowSpecialDay.description}</p>
    </div>
);

const FriendCard: React.FC<{
    friend: FriendConnection;
    isFollowing: boolean;
    onFollowToggle: (friendId: string) => void;
}> = ({ friend, isFollowing, onFollowToggle }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-3">
            <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
                <h3 className="text-lg font-semibold text-neutral-800">{friend.name}</h3>
                <p className="text-sm text-neutral-500">
                    {friend.isNearby ? "A short walk away" : "In your wider community"}
                </p>
            </div>
        </div>
        <p className="text-neutral-700 bg-neutral-100/70 rounded-xl px-4 py-3">
            {friend.celebrationMessage}
        </p>
        <button
            onClick={() => onFollowToggle(friend.id)}
            className={`w-full py-3 px-4 font-bold rounded-lg transition-colors ${
                isFollowing ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-special-primary text-white hover:opacity-90"
            }`}
        >
            {isFollowing ? "Following" : "Follow & say hi"}
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

    return (
        <div className="h-full w-full relative">
            <InteractiveMap
                celebrations={filteredCelebrations}
                selectedCelebrationId={selectedCelebration?.id ?? null}
                onSelectCelebration={(id) => handleSelectCelebration(id ? filteredCelebrations.find(c => c.id === id) ?? null : null)}
                friends={friends}
                showFriendsLayer={showFriendsLayer}
                onSelectFriend={handleSelectFriend}
                highlightedFriendId={selectedFriendId}
            />
            <FloatingHeader
                specialDay={specialDay}
                searchQuery={searchInput}
                onSearchChange={setSearchInput}
                onToggleFriendsLayer={() => setShowFriendsLayer(prev => !prev)}
                showFriendsLayer={showFriendsLayer}
            />
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
                    <div className="space-y-3">
                        {filteredCelebrations.map(c => (
                            <CelebrationCard
                                key={c.id}
                                celebration={c}
                                isSaved={bookmarkedIds.includes(c.id)}
                                onClick={() => handleSelectCelebration(c)}
                            />
                        ))}
                        <TomorrowCard tomorrowSpecialDay={tomorrowSpecialDay} />
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};
