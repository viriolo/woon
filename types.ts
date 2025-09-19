
export interface SpecialDay {
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface Celebration {
  id: number;
  author: string;
  authorId: string;
  title: string;
  description: string;
  imageUrl: string;
  likes: number;
  commentCount: number;
  position: { lng: number; lat: number };
}

export interface UserLocation {
  lng: number;
  lat: number;
}

export interface NotificationPreferences {
  dailySpecialDay: boolean;
  communityActivity: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  notificationPreferences: NotificationPreferences;
  likedCelebrationIds: number[];
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  authorId: string;
  authorName: string;
  locationCoords: { lng: number; lat: number };
}

export interface Comment {
  id: string;
  celebrationId: number;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
}