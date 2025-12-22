-- Migration to add comment system to feature suggestions
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Feature suggestion comments table with threading support
CREATE TABLE IF NOT EXISTS feature_suggestion_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES feature_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feature_suggestion_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Feature suggestion comment votes table
CREATE TABLE IF NOT EXISTS feature_suggestion_comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES feature_suggestion_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_fs_comments_suggestion_id
  ON feature_suggestion_comments(suggestion_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fs_comments_parent_id
  ON feature_suggestion_comments(parent_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fs_comments_user_id
  ON feature_suggestion_comments(user_id)
  WHERE deleted_at IS NULL;

-- Indexes for comment votes
CREATE INDEX IF NOT EXISTS idx_fs_comment_votes_comment_id
  ON feature_suggestion_comment_votes(comment_id);

CREATE INDEX IF NOT EXISTS idx_fs_comment_votes_user_id
  ON feature_suggestion_comment_votes(user_id);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to auto-update updated_at timestamp on comments
CREATE OR REPLACE FUNCTION update_fs_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fs_comments_updated_at
  BEFORE UPDATE ON feature_suggestion_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_fs_comments_updated_at();

-- Trigger to auto-update updated_at timestamp on comment votes
CREATE OR REPLACE FUNCTION update_fs_comment_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fs_comment_votes_updated_at
  BEFORE UPDATE ON feature_suggestion_comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_fs_comment_votes_updated_at();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE feature_suggestion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestion_comment_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - FEATURE SUGGESTION COMMENTS
-- ============================================================================

-- View: All non-deleted comments are viewable by everyone
CREATE POLICY "Comments are viewable by everyone"
  ON feature_suggestion_comments FOR SELECT
  USING (deleted_at IS NULL);

-- Create: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON feature_suggestion_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON feature_suggestion_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - COMMENT VOTES
-- ============================================================================

-- View: Anyone can view comment votes
CREATE POLICY "Anyone can view comment votes"
  ON feature_suggestion_comment_votes
  FOR SELECT
  USING (true);

-- Create: Users can insert their own votes
CREATE POLICY "Users can create their votes"
  ON feature_suggestion_comment_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update: Users can update their own votes
CREATE POLICY "Users can update their votes"
  ON feature_suggestion_comment_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can delete their own votes
CREATE POLICY "Users can delete their votes"
  ON feature_suggestion_comment_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SOFT DELETE FUNCTION
-- ============================================================================

-- Function to soft delete comments (bypasses RLS)
CREATE OR REPLACE FUNCTION soft_delete_fs_comment(
  comment_id UUID,
  requesting_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  comment_record RECORD;
  result JSON;
BEGIN
  -- Check if comment exists and belongs to user
  SELECT * INTO comment_record
  FROM feature_suggestion_comments
  WHERE id = comment_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Comment not found');
  END IF;

  IF comment_record.user_id != requesting_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF comment_record.deleted_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already deleted');
  END IF;

  -- Perform the soft delete
  UPDATE feature_suggestion_comments
  SET deleted_at = NOW()
  WHERE id = comment_id;

  -- Return the updated record
  SELECT json_build_object(
    'success', true,
    'data', row_to_json(feature_suggestion_comments.*)
  ) INTO result
  FROM feature_suggestion_comments
  WHERE id = comment_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_fs_comment(UUID, UUID) TO authenticated;
