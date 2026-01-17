-- REALones Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table (Active Circle + Remember Me Archive)
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for FB imports without linked accounts
  status TEXT NOT NULL CHECK (status IN ('active', 'archived', 'pending', 'import_pool')),
  source TEXT NOT NULL CHECK (source IN ('manual', 'facebook_import')),
  facebook_data JSONB, -- Stores name, profile_url, timestamp from FB import
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id) -- Prevent duplicate friendships (only when friend_id is not null)
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'photo', 'video', 'checkin', 'poll')),
  visibility TEXT NOT NULL DEFAULT 'circle' CHECK (visibility IN ('circle', 'group')),
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heart', 'hug', 'laugh', 'wow', 'sad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- One reaction per user per post
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (friend subsets/circles)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES friends(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, friend_id)
);

-- Bulk messages
CREATE TABLE bulk_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('all', 'group')),
  group_id UUID REFERENCES groups(id),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks (gamification)
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('cull_count', 'streak_days', 'archive_count', 'special')),
  requirement_value INTEGER NOT NULL DEFAULT 0
);

-- User badges (earned badges)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Import sessions (Facebook import tracking)
CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired')),
  total_imported INTEGER NOT NULL DEFAULT 0,
  categorized_active INTEGER NOT NULL DEFAULT 0,
  categorized_archived INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Subscriptions (for extra friends beyond 200)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  extra_friends_count INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist (for landing page)
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read any profile, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Friends: Users can manage their own friends
CREATE POLICY "Users can view own friends" ON friends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own friends" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friends" ON friends
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own friends" ON friends
  FOR DELETE USING (auth.uid() = user_id);

-- Posts: Users can see posts from their active friends
CREATE POLICY "Users can view posts from friends" ON posts
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friends
      WHERE friends.user_id = auth.uid()
      AND friends.friend_id = posts.user_id
      AND friends.status = 'active'
    )
  );

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Reactions: Users can manage their own reactions
CREATE POLICY "Users can view reactions" ON reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reactions" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments: Similar to posts
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Groups: Users can manage their own groups
CREATE POLICY "Users can view own groups" ON groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own groups" ON groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own groups" ON groups
  FOR DELETE USING (auth.uid() = user_id);

-- Streaks: Users can manage their own streaks
CREATE POLICY "Users can view own streaks" ON streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges: Everyone can view badges
CREATE POLICY "Badges are viewable by everyone" ON badges
  FOR SELECT USING (true);

-- User badges: Users can view their own badges
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Import sessions: Users can manage their own imports
CREATE POLICY "Users can view own imports" ON import_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own imports" ON import_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own imports" ON import_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Bulk messages: Users can manage their own
CREATE POLICY "Users can view own bulk messages" ON bulk_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bulk messages" ON bulk_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- TRIGGERS
-- =====================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- SEED DATA (Badges)
-- =====================

INSERT INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Cull', 'Archived your first friend', '🌱', 'archive_count', 1),
  ('Declutter Hero', 'Archived 50 friends', '🧹', 'archive_count', 50),
  ('Master Curator', 'Archived 100 friends', '👑', 'archive_count', 100),
  ('Week Warrior', 'Maintained a 7-day streak', '🔥', 'streak_days', 7),
  ('Flame Keeper', 'Maintained a 30-day streak', '🔥', 'streak_days', 30),
  ('Streak Legend', 'Maintained a 100-day streak', '⭐', 'streak_days', 100),
  ('Circle Complete', 'Reached 200 active friends', '🎯', 'special', 200);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_status ON friends(user_id, status);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
