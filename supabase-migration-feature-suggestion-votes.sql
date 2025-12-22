-- Create feature_suggestion_votes table
CREATE TABLE IF NOT EXISTS feature_suggestion_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES feature_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_feature_suggestion_votes_suggestion_id ON feature_suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_feature_suggestion_votes_user_id ON feature_suggestion_votes(user_id);

-- Enable RLS
ALTER TABLE feature_suggestion_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view votes
CREATE POLICY "Anyone can view feature suggestion votes"
  ON feature_suggestion_votes
  FOR SELECT
  USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can create their votes"
  ON feature_suggestion_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their votes"
  ON feature_suggestion_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their votes"
  ON feature_suggestion_votes
  FOR DELETE
  USING (auth.uid() = user_id);
