-- Pioneer System for REALones
-- Users must earn 5 credits to unlock full app access

-- Pioneer status table
CREATE TABLE pioneer_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0,
  is_activated BOOLEAN NOT NULL DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pioneer credits log (tracks how credits were earned)
CREATE TABLE pioneer_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('friend_joined', 'facebook_import', 'profile_complete', 'contacts_import')),
  source_id UUID, -- ID of friend who joined, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, credit_type, source_id) -- Prevent duplicate credits for same action
);

-- Add unique constraint for non-friend credits (only one per type per user)
CREATE UNIQUE INDEX idx_pioneer_credits_single
ON pioneer_credits(user_id, credit_type)
WHERE credit_type IN ('facebook_import', 'profile_complete', 'contacts_import');

-- Enable RLS
ALTER TABLE pioneer_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE pioneer_credits ENABLE ROW LEVEL SECURITY;

-- Pioneer status policies
CREATE POLICY "Users can view own pioneer status" ON pioneer_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pioneer status" ON pioneer_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pioneer status" ON pioneer_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Pioneer credits policies
CREATE POLICY "Users can view own credits" ON pioneer_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON pioneer_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update pioneer_status when credits change
CREATE OR REPLACE FUNCTION update_pioneer_credits_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the credits count
  UPDATE pioneer_status
  SET
    credits = (SELECT COUNT(*) FROM pioneer_credits WHERE user_id = NEW.user_id),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- Check if user should be activated (5+ credits)
  UPDATE pioneer_status
  SET
    is_activated = TRUE,
    activated_at = NOW()
  WHERE user_id = NEW.user_id
    AND credits >= 5
    AND is_activated = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_pioneer_credit_added
  AFTER INSERT ON pioneer_credits
  FOR EACH ROW EXECUTE FUNCTION update_pioneer_credits_count();

-- Auto-create pioneer_status when user signs up
CREATE OR REPLACE FUNCTION create_pioneer_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pioneer_status (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_pioneer
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_pioneer_status();

-- Add invited_by field to profiles for tracking referrals
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id);

-- Indexes
CREATE INDEX idx_pioneer_status_user_id ON pioneer_status(user_id);
CREATE INDEX idx_pioneer_status_activated ON pioneer_status(is_activated);
CREATE INDEX idx_pioneer_credits_user_id ON pioneer_credits(user_id);
