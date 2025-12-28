-- Migration: Add Recent Events support to audit_logs
-- This extends the audit_logs system to support user-facing event tracking

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop existing constraints if they exist
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_type_check;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_resource_type_check;

-- Add action type constraint with all event types including new ones
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_type_check
  CHECK (action_type IN (
    'project_created',
    'project_updated',
    'project_deleted',
    'project_archived',
    'project_unarchived',
    'user_created',
    'user_role_changed',
    'user_deleted',
    'user_login',
    'user_logout',
    'user_signup',
    'ai_settings_changed',
    'admin_settings_changed',
    -- NEW: Feature suggestion events
    'feature_suggestion_created',
    'feature_suggestion_status_changed',
    -- NEW: Feedback events
    'feedback_created',
    'feedback_comment_created'
  ));

-- Add resource type constraint with all types including new ones
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_resource_type_check
  CHECK (resource_type IN (
    'project',
    'user',
    'auth',
    'settings',
    'feature_suggestion',  -- NEW
    'feedback'             -- NEW
  ));

-- Enable Row Level Security if not already enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view recent events" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- RLS Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Regular users can view recent events
CREATE POLICY "Users can view recent events"
  ON audit_logs FOR SELECT
  USING (
    -- Users can see project-related events
    (resource_type IN ('project', 'feature_suggestion', 'feedback') AND action_type IN (
      'project_created',
      'feature_suggestion_created',
      'feedback_created'
    ))
    OR
    -- Users can see user signup events
    (resource_type = 'auth' AND action_type = 'user_signup')
  );

-- RLS Policy: System can insert audit logs (no user context required for logging)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING GIN(metadata);

-- Create composite index for recent events queries (optimized for time-based filtering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent_events
  ON audit_logs(created_at DESC, action_type, resource_type)
  WHERE action_type IN (
    'project_created',
    'user_signup',
    'feature_suggestion_created',
    'feedback_created'
  );

-- Create index for project-based filtering using JSONB metadata
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_project_id
  ON audit_logs((metadata->>'project_id'))
  WHERE metadata ? 'project_id';

-- Note: event_filters will be stored in the existing profiles.project_filters JSONB column
-- No additional column needed - the structure will be:
-- event_filters: {
--   category: 'all' | 'user-related' | 'project-related',
--   projectId: string | 'all',
--   timeRange: '24h' | '7d' | '30d' | 'all',
--   favoritesOnly: boolean,
--   contributingOnly: boolean
-- }
