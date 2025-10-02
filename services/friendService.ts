import type { FriendConnection, User } from "../types";
import { supabaseFriendService } from "./supabaseFriendService";

export const friendService = {
    async getConnectionsForUser(user: User | null): Promise<FriendConnection[]> {
        const connections = await supabaseFriendService.getConnectionsForUser(user?.id ?? null);

        const normalizeHandle = (name: string, fallback: string) => {
            const sanitized = name.toLowerCase().replace(/[^a-z0-9_]/g, "");
            return sanitized || fallback;
        };

        const baseConnections = connections.map(connection => ({
            ...connection,
            handle: connection.handle ?? normalizeHandle(connection.name, connection.id.slice(0, 8)),
        }));

        if (!user) {
            return baseConnections.map(connection => ({ ...connection, isNearby: connection.isNearby }));
        }

        const followingSet = new Set(user.followingUserIds);
        return baseConnections.map(connection => ({
            ...connection,
            isNearby: connection.isNearby || followingSet.has(connection.id),
        }));
    },
};
