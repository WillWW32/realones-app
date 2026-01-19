-- =============================================================================
-- JESS CONVERSATIONS TABLE — REALones
-- =============================================================================
-- Stores Jess chat history per user
-- Run this in Supabase SQL Editor for the REALones project
-- =============================================================================

-- Create table
CREATE TABLE IF NOT EXISTS jess_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One conversation per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE jess_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversations
CREATE POLICY "Users can view own jess conversations"
  ON jess_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jess conversations"
  ON jess_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jess conversations"
  ON jess_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_jess_conversations_user_id 
  ON jess_conversations(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_jess_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jess_conversations_updated_at
  BEFORE UPDATE ON jess_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_jess_updated_at();
