import type { FriendConnection, User } from "../types";
import { supabaseFriendService } from "./supabaseFriendService";

export const friendService = {
    async getConnectionsForUser(user: User | null): Promise<FriendConnection[]> {
        const connections = await supabaseFriendService.getConnectionsForUser(user?.id ?? null);

        if (!user) {
            return connections.map(connection => ({ ...connection, isNearby: connection.isNearby }));
        }

        const followingSet = new Set(user.followingUserIds);
        return connections.map(connection => ({
            ...connection,
            isNearby: connection.isNearby || followingSet.has(connection.id),
        }));
    },
};
