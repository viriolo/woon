import type { SpecialDay, Celebration, UserLocation } from './types';

// IMPORTANT: Replace with your own Mapbox access token
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2p0MG01MXRqMW45cjQzb2R6b2ptc3J4MSJ9.zA2W0IkI0c6QhamG4uQb3A';

export const TODAY_SPECIAL_DAY: SpecialDay = {
    title: "World Creativity Day",
    description: "A day to celebrate and encourage creative thinking and innovation in all aspects of human expression.",
    date: "April 21",
    category: "Global Observance"
};

export const TOMORROW_SPECIAL_DAY: SpecialDay = {
    title: "Earth Day",
    description: "An annual event to demonstrate support for environmental protection, with events coordinated globally.",
    date: "April 22",
    category: "Environmental"
};

// Coordinates are centered around San Francisco for demo purposes
export const CELEBRATIONS: Celebration[] = [
    { id: 1, author: "Maria S.", title: "My watercolor station", imageUrl: "https://picsum.photos/seed/woon1/400/300", likes: 142, position: { lng: -122.41, lat: 37.78 } },
    { id: 2, author: "David L.", title: "LEGO sculpture fun!", imageUrl: "https://picsum.photos/seed/woon2/400/300", likes: 88, position: { lng: -122.42, lat: 37.76 } },
    { id: 3, author: "Chloe T.", title: "Backyard mural", imageUrl: "https://picsum.photos/seed/woon3/400/300", likes: 215, position: { lng: -122.43, lat: 37.77 } },
    { id: 4, author: "Kenji R.", title: "Creative coding art", imageUrl: "https://picsum.photos/seed/woon4/400/300", likes: 95, position: { lng: -122.40, lat: 37.765 } },
    { id: 5, author: "Sophie B.", title: "Origami garden", imageUrl: "https://picsum.photos/seed/woon5/400/300", likes: 180, position: { lng: -122.415, lat: 37.775 } },
];

export const USER_LOCATION: UserLocation = {
    lng: -122.4194,
    lat: 37.7749
};