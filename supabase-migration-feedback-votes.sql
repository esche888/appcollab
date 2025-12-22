-- Create feedback_votes table
CREATE TABLE IF NOT EXISTS feedback_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON feedback_votes(user_id);

-- Enable RLS
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view votes
CREATE POLICY "Anyone can view feedback votes"
  ON feedback_votes
  FOR SELECT
  USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can create their votes"
  ON feedback_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their votes"
  ON feedback_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their votes"
  ON feedback_votes
  FOR DELETE
  USING (auth.uid() = user_id);
