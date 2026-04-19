import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  
  // Onboarding data
  age?: number;
  sex?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
  goal?: 'cut' | 'maintain' | 'bulk';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  modality?: 'gym' | 'home' | 'both';
  
  // Stats
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Timestamp | null;
  achievements: string[];
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
