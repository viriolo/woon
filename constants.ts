import type { SpecialDay, Celebration, UserLocation, FriendConnection } from "./types";

const env = import.meta.env;

export const MAPBOX_ACCESS_TOKEN = env.VITE_MAPBOX_ACCESS_TOKEN ?? "";
export const GEMINI_API_KEY = env.VITE_GEMINI_API_KEY ?? "";

if (!MAPBOX_ACCESS_TOKEN) {
    console.warn("Mapbox access token is not configured. Set VITE_MAPBOX_ACCESS_TOKEN in your environment.");
}

if (!GEMINI_API_KEY) {
    console.warn("Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your environment.");
}

export const TODAY_SPECIAL_DAY: SpecialDay = {
    title: "World Creativity Day",
    description: "A day to celebrate and encourage creative thinking and innovation in all aspects of human expression.",
    date: "April 21",
    category: "Global Observance",
};

export const TOMORROW_SPECIAL_DAY: SpecialDay = {
    title: "Earth Day",
    description: "An annual event to demonstrate support for environmental protection, with events coordinated globally.",
    date: "April 22",
    category: "Environmental",
};

export const CELEBRATIONS: Celebration[] = [
    { id: 1, authorId: "user_mock_1", author: "Maria S.", title: "My watercolor station", description: "Setting up my paints for a fun afternoon!", imageUrl: "https://picsum.photos/seed/woon1/400/300", likes: 142, commentCount: 3, position: { lng: -122.41, lat: 37.78 } },
    { id: 2, authorId: "user_mock_2", author: "David L.", title: "LEGO sculpture fun!", description: "Building a giant castle with the kids.", imageUrl: "https://picsum.photos/seed/woon2/400/300", likes: 88, commentCount: 5, position: { lng: -122.42, lat: 37.76 } },
    { id: 3, authorId: "user_mock_3", author: "Chloe T.", title: "Backyard mural", description: "First coat of paint on our new fence mural.", imageUrl: "https://picsum.photos/seed/woon3/400/300", likes: 215, commentCount: 12, position: { lng: -122.43, lat: 37.77 } },
    { id: 4, authorId: "user_mock_4", author: "Kenji R.", title: "Creative coding art", description: "Generative art piece I'm working on today.", imageUrl: "https://picsum.photos/seed/woon4/400/300", likes: 95, commentCount: 2, position: { lng: -122.4, lat: 37.765 } },
    { id: 5, authorId: "user_mock_5", author: "Sophie B.", title: "Origami garden", description: "Folding a thousand paper cranes for good luck.", imageUrl: "https://picsum.photos/seed/woon5/400/300", likes: 180, commentCount: 7, position: { lng: -122.415, lat: 37.775 } },
];

export const USER_LOCATION: UserLocation = {
    lng: -122.4194,
    lat: 37.7749,
};

export const FRIEND_CONNECTIONS: FriendConnection[] = [
    {
        id: "friend_1",
        name: "Ava L.",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        location: { lng: -122.4094, lat: 37.7849 },
        celebrationMessage: "Setting up a mural jam in the Mission!",
        isNearby: true,
    },
    {
        id: "friend_2",
        name: "Marco P.",
        avatarUrl: "https://i.pravatar.cc/150?img=33",
        location: { lng: -122.4294, lat: 37.7649 },
        celebrationMessage: "Hosting a live sketch session downtown.",
        isNearby: true,
    },
    {
        id: "friend_3",
        name: "Priya K.",
        avatarUrl: "https://i.pravatar.cc/150?img=47",
        location: { lng: -122.3994, lat: 37.7749 },
        celebrationMessage: "Organizing a gratitude wall installation.",
        isNearby: false,
    },
];
