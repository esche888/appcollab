-- ============================================================================
-- APP FEEDBACK FEATURE MIGRATION
-- Creates tables for app-wide feedback with flat comments
-- ============================================================================

-- Create app_feedback table
CREATE TABLE app_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (title != '' AND LENGTH(title) >= 3),
  description TEXT NOT NULL CHECK (description != '' AND LENGTH(description) >= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create app_feedback_comments table (flat structure, NO threading)
CREATE TABLE app_feedback_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_feedback_id UUID NOT NULL REFERENCES app_feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (content != '' AND LENGTH(content) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_app_feedback_user_id ON app_feedback(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_feedback_created_at ON app_feedback(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_feedback_comments_feedback_id ON app_feedback_comments(app_feedback_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_feedback_comments_user_id ON app_feedback_comments(user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS FOR AUTO-TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_app_feedback_updated_at BEFORE UPDATE ON app_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_feedback_comments_updated_at BEFORE UPDATE ON app_feedback_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feedback_comments ENABLE ROW LEVEL SECURITY;

-- App Feedback Policies
CREATE POLICY "App feedback viewable by everyone"
  ON app_feedback FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create app feedback"
  ON app_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app feedback"
  ON app_feedback FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete their own app feedback"
  ON app_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- App Feedback Comments Policies
CREATE POLICY "App feedback comments viewable by everyone"
  ON app_feedback_comments FOR SELECT
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM app_feedback
      WHERE app_feedback.id = app_feedback_comments.app_feedback_id
      AND app_feedback.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can create app feedback comments"
  ON app_feedback_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM app_feedback
      WHERE app_feedback.id = app_feedback_comments.app_feedback_id
      AND app_feedback.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can update their own app feedback comments"
  ON app_feedback_comments FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete their own app feedback comments"
  ON app_feedback_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT ALL ON app_feedback TO anon, authenticated;
GRANT ALL ON app_feedback_comments TO anon, authenticated;
