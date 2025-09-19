
export interface SpecialDay {
  title: string;
  description: string;
  date: string;
  category: string;
}

export interface Celebration {
  id: number;
  author: string;
  title: string;
  imageUrl: string;
  likes: number;
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
  notificationPreferences: NotificationPreferences;
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