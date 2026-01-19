-- Memory Book table for scrapbooking past memories
-- Run this in Supabase SQL Editor

-- Create memory_book table
CREATE TABLE memory_book (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Memory',
  content TEXT,
  memory_date TIMESTAMPTZ NOT NULL, -- When the memory actually happened
  media_urls TEXT[], -- Photos associated with this memory
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE memory_book ENABLE ROW LEVEL SECURITY;

-- Users can only see their own memories
CREATE POLICY "Users can view own memories" ON memory_book
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON memory_book
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON memory_book
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON memory_book
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_memory_book_updated_at
  BEFORE UPDATE ON memory_book
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_memory_book_user_id ON memory_book(user_id);
CREATE INDEX idx_memory_book_memory_date ON memory_book(memory_date);

-- Create storage bucket for memory book photos
-- Note: Run this in the Supabase Dashboard under Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('memory-book', 'memory-book', true);
