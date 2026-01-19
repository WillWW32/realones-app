// User profile
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  invited_by?: string; // User ID of who invited them
  created_at: string;
  updated_at: string;
}

// Pioneer status
export interface PioneerStatus {
  id: string;
  user_id: string;
  credits: number;
  is_activated: boolean;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

// Pioneer credit types
export type PioneerCreditType = 'friend_joined' | 'facebook_import' | 'profile_complete' | 'contacts_import';

// Friend tiers - your inner circles
export type FriendTier = 'realones' | 'squad' | 'rideordies';

// Friend tier descriptions
export const FRIEND_TIERS = {
  rideordies: {
    name: 'Ride or Dies',
    emoji: '💪',
    maxCount: 4,
    description: 'Your absolute closest people. Max 4.',
    color: '#E91E63', // pink/heart color
  },
  squad: {
    name: 'Squad',
    emoji: '🤝',
    maxCount: 12,
    description: 'Your inner circle. Max 12.',
    color: '#4CAF50', // green/success
  },
  realones: {
    name: 'Real Ones',
    emoji: '✨',
    maxCount: 200,
    description: 'Your real friends. Max 200.',
    color: '#4A9BB8', // teal/accent
  },
};

// Friend relationship
export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'active' | 'archived' | 'pending' | 'import_pool';
  source: 'manual' | 'facebook_import' | 'contacts_import';
  tier?: FriendTier;
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
  // Free tier limits
  FREE_ACTIVE_LIMIT: 100,
  FREE_ARCHIVED_LIMIT: 100,
  FREE_FRIEND_LIMIT: 200, // Total: active + archived
  // Pricing
  EXTRA_FRIENDS_PER_TIER: 10,
  PRICE_PER_TIER_CENTS: 100, // $1 per 10 extra friends
  MAX_TOTAL_FRIENDS: 500, // Hard cap even with payment
  // Cull settings
  DEFAULT_CULL_PERIOD_DAYS: 30,
  MIN_CULL_PERIOD_DAYS: 7,
  MAX_CULL_PERIOD_DAYS: 60,
};

// Pricing tiers explanation
export const PRICING_INFO = {
  free: {
    name: 'Free',
    price: '$0/month',
    features: [
      '100 active friends',
      '100 archived (Remember Me)',
      'Unlimited posts',
      'Group messaging (Besties + Squad)',
    ],
  },
  premium: {
    name: 'Premium',
    pricePerTen: '$1/month per 10 extra friends',
    features: [
      'Expand beyond 100 active friends',
      'Up to 500 total friends',
      'Priority support',
    ],
  },
};
