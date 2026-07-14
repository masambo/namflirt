export interface Preferences {
  preferredGender?: string;
  minAge: number;
  maxAge: number;
  preferredRegions: string[];
  preferredLanguages: string[];
  preferredTribes: string[];
  tribeImportance: string;
  preferredRelationshipGoal?: string;
  preferredHobbies: string[];
  openToLongDistance: boolean;
}

export interface Profile {
  _id: string;
  _creationTime: number;
  displayName: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  region?: string;
  town?: string;
  tribe?: string;
  languages: string[];
  hobbies: string[];
  lifestyle: string[];
  relationshipGoal?: string;
  religion?: string;
  education?: string;
  occupation?: string;
  photos: string[];
  verified: boolean;
  completed: boolean;
  isDemo: boolean;
  email?: string;
  status?: "active" | "suspended";
  moderationNote?: string;
  plan?: "free" | "premium" | "vip";
  premiumTrialEndsAt?: number;
  usageMonth?: string;
  usageDay?: string;
  messagesUsedThisMonth?: number;
  profileViewsUsedThisMonth?: number;
  likesUsedToday?: number;
  lastActive: number;
  preferences?: Preferences | null;
}

export interface Conversation {
  _id: string;
  _creationTime: number;
  lastMessage?: string;
  lastMessageAt?: number;
  other: Profile | null;
  unreadCount?: number;
}

export interface Message {
  _id: string;
  senderProfileId: string;
  body: string;
  createdAt: number;
  readAt?: number;
}
