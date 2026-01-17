-- REALones Messaging Tables
-- Run this in Supabase SQL Editor

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('dm', 'besties', 'squad')),
  name TEXT, -- NULL for DMs, custom name for groups
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation members
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Push notification tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Conversations: users can only see conversations they're members of
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Conversation members: users can see members of their conversations
CREATE POLICY "Users can view conversation members"
  ON conversation_members FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation creators can add members"
  ON conversation_members FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
  );

-- Messages: users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- Push tokens: users can only manage their own tokens
CREATE POLICY "Users can view their push tokens"
  ON push_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their push tokens"
  ON push_tokens FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their push tokens"
  ON push_tokens FOR DELETE
  USING (user_id = auth.uid());

-- Function to update conversation updated_at when new message arrives
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to validate conversation member limits
CREATE OR REPLACE FUNCTION validate_conversation_members()
RETURNS TRIGGER AS $$
DECLARE
  conv_type TEXT;
  member_count INT;
BEGIN
  SELECT type INTO conv_type FROM conversations WHERE id = NEW.conversation_id;
  SELECT COUNT(*) INTO member_count FROM conversation_members WHERE conversation_id = NEW.conversation_id;
  
  IF conv_type = 'dm' AND member_count >= 2 THEN
    RAISE EXCEPTION 'DM conversations can only have 2 members';
  ELSIF conv_type = 'besties' AND member_count >= 4 THEN
    RAISE EXCEPTION 'Besties conversations can only have 4 members';
  ELSIF conv_type = 'squad' AND member_count >= 12 THEN
    RAISE EXCEPTION 'Squad conversations can only have 12 members';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_member_limit
  BEFORE INSERT ON conversation_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_conversation_members();
