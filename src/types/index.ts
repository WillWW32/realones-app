// User profile
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

// Friend relationship
export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'active' | 'archived' | 'pending' | 'import_pool';
  source: 'manual' | 'facebook_import';
  facebook_data?: FacebookFriendData;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  // Joined data
  friend_profile?: User;
}

// Facebook import data stored per friend
export interface FacebookFriendData {
  name: string;
  profile_url?: string;
  timestamp?: number;
}

// Post in the feed
export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  post_type: 'text' | 'photo' | 'video' | 'checkin' | 'poll';
  visibility: 'circle' | 'group';
  group_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: User;
  reactions_count?: number;
  comments_count?: number;
  user_reaction?: string | null;
}

// Reactions (simple, warm)
export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  type: 'heart' | 'hug' | 'laugh' | 'wow' | 'sad';
  created_at: string;
}

// Comments
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: User;
}

// Group circles (subsets of friends)
export interface Group {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

// Group membership
export interface GroupMember {
  id: string;
  group_id: string;
  friend_id: string;
  added_at: string;
}

// Bulk message
export interface BulkMessage {
  id: string;
  user_id: string;
  content: string;
  recipient_type: 'all' | 'group';
  group_id?: string;
  sent_at: string;
  recipient_count: number;
}

// Gamification - Streaks
export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_action_date: string;
  created_at: string;
}

// Gamification - Badges
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'cull_count' | 'streak_days' | 'archive_count' | 'special';
  requirement_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// Facebook Import Session
export interface ImportSession {
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed' | 'expired';
  total_imported: number;
  categorized_active: number;
  categorized_archived: number;
  remaining: number;
  started_at: string;
  deadline_at: string;
  completed_at?: string;
}

// Subscription / Pricing
export interface Subscription {
  id: string;
  user_id: string;
  extra_friends_count: number; // 0 = free tier (200 max)
  price_cents: number; // $1 per 10 = 100 cents per 10
  status: 'active' | 'cancelled' | 'past_due';
  current_period_end: string;
  created_at: string;
}

// App constants
export const CONSTANTS = {
  FREE_FRIEND_LIMIT: 200,
  EXTRA_FRIENDS_PER_TIER: 10,
  PRICE_PER_TIER_CENTS: 100, // $1
  MAX_TOTAL_FRIENDS: 500, // Hard cap even with payment
  DEFAULT_CULL_PERIOD_DAYS: 30,
  MIN_CULL_PERIOD_DAYS: 7,
  MAX_CULL_PERIOD_DAYS: 60,
};
