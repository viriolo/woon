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