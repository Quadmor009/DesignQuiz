-- Add twitter_handle column to leaderboard table
ALTER TABLE leaderboard 
ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255);

-- Create index for faster queries by twitter_handle
CREATE INDEX IF NOT EXISTS idx_leaderboard_twitter ON leaderboard(twitter_handle) WHERE twitter_handle IS NOT NULL;

