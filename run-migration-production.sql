-- Migration 002: Add Twitter handle column to leaderboard table
-- Run this in your Render PostgreSQL database

-- Add twitter_handle column to leaderboard table
ALTER TABLE leaderboard 
ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255);

-- Create index for faster queries by twitter_handle
CREATE INDEX IF NOT EXISTS idx_leaderboard_twitter ON leaderboard(twitter_handle) WHERE twitter_handle IS NOT NULL;

-- Verify the column was added (optional - just to confirm)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leaderboard' AND column_name = 'twitter_handle';

