import type { SpecialDay, Celebration, UserLocation } from './types';

// IMPORTANT: Replace with your own Mapbox access token from your mapbox.com account
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoidmlpbm5vIiwiYSI6ImNtZnA5bmh6ZDBkcDMybXBzbmZqMWs1cXAifQ.1LFslO7Ge-PEuiNEYT5DYw';
// IMPORTANT: Replace with your own Gemini API Key from Google AI Studio
export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

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
    { id: 1, authorId: 'user_mock_1', author: "Maria S.", title: "My watercolor station", description: "Setting up my paints for a fun afternoon!", imageUrl: "https://picsum.photos/seed/woon1/400/300", likes: 142, position: { lng: -122.41, lat: 37.78 } },
    { id: 2, authorId: 'user_mock_2', author: "David L.", title: "LEGO sculpture fun!", description: "Building a giant castle with the kids.", imageUrl: "https://picsum.photos/seed/woon2/400/300", likes: 88, position: { lng: -122.42, lat: 37.76 } },
    { id: 3, authorId: 'user_mock_3', author: "Chloe T.", title: "Backyard mural", description: "First coat of paint on our new fence mural.", imageUrl: "https://picsum.photos/seed/woon3/400/300", likes: 215, position: { lng: -122.43, lat: 37.77 } },
    { id: 4, authorId: 'user_mock_4', author: "Kenji R.", title: "Creative coding art", description: "Generative art piece I'm working on today.", imageUrl: "https://picsum.photos/seed/woon4/400/300", likes: 95, position: { lng: -122.40, lat: 37.765 } },
    { id: 5, authorId: 'user_mock_5', author: "Sophie B.", title: "Origami garden", description: "Folding a thousand paper cranes for good luck.", imageUrl: "https://picsum.photos/seed/woon5/400/300", likes: 180, position: { lng: -122.415, lat: 37.775 } },
];

export const USER_LOCATION: UserLocation = {
    lng: -122.4194,
    lat: 37.7749
};