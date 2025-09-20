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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  handle?: string;
  notificationPreferences: NotificationPreferences;
  likedCelebrationIds: number[];
  savedCelebrationIds: number[];
  rsvpedEventIds: string[];
  followingUserIds: string[];
  streakDays: number;
  experiencePoints: number;
  achievements: Achievement[];
  level: number;
}

export interface EventAttendee {
  userId: string;
  userName: string;
  avatarUrl?: string;
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
  attendeeCount: number;
  attendees: EventAttendee[];
  locationCoords: { lng: number; lat: number };
}

export interface Comment {
  id: string;
  celebrationId: number;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
  mentions?: string[];
}

export interface FriendConnection {
  id: string;
  name: string;
  avatarUrl: string;
  location: UserLocation;
  celebrationMessage: string;
  isNearby: boolean;
}
