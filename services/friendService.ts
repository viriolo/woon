import type { FriendConnection, User } from "../types";
import { FRIEND_CONNECTIONS } from "../constants";

const FRIENDS_STORAGE_KEY = "woon_friend_overrides";

interface StoredFriend extends FriendConnection {
    notes?: string;
}

const getStoredFriends = (): StoredFriend[] => {
    try {
        const stored = localStorage.getItem(FRIENDS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to read friend overrides:", error);
        return [];
    }
};

const mergeFriends = (): FriendConnection[] => {
    const overrides = getStoredFriends();
    if (!overrides.length) {
        return FRIEND_CONNECTIONS;
    }

    const overrideMap = new Map(overrides.map(friend => [friend.id, friend]));
    return FRIEND_CONNECTIONS.map(friend => overrideMap.get(friend.id) ?? friend);
};

export const friendService = {
    getConnectionsForUser: async (user: User | null): Promise<FriendConnection[]> => {
        await new Promise(resolve => setTimeout(resolve, 150));
        if (!user) {
            return FRIEND_CONNECTIONS.filter(connection => connection.isNearby);
        }

        const friends = mergeFriends();
        return friends.map(friend => ({
            ...friend,
            isNearby: friend.isNearby || user.followingUserIds.includes(friend.id),
        }));
    },
};
