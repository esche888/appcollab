-- AppCollab Master Database Schema
-- This script creates the complete database schema from scratch with ALL features
-- Including: Projects, Feedback, Feature Suggestions, Best Practices, Audit Logs, Recent Events, etc.
-- Run this in your Supabase SQL Editor to set up a fresh database

-- ============================================================================
-- CLEANUP (WARNING: This will delete all existing data!)
-- ============================================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS feature_suggestion_comment_votes CASCADE;
DROP TABLE IF EXISTS feature_suggestion_comments CASCADE;
DROP TABLE IF EXISTS feature_suggestion_votes CASCADE;
DROP TABLE IF EXISTS feedback_votes CASCADE;
DROP TABLE IF EXISTS app_feedback_comments CASCADE;
DROP TABLE IF EXISTS app_feedback CASCADE;
DROP TABLE IF EXISTS best_practice_requests CASCADE;
DROP TABLE IF EXISTS best_practice_comments CASCADE;
DROP TABLE IF EXISTS best_practices CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS project_updates CASCADE;
DROP TABLE IF EXISTS favorite_projects CASCADE;
DROP TABLE IF EXISTS ai_usage_logs CASCADE;
DROP TABLE IF EXISTS ai_settings CASCADE;
DROP TABLE IF EXISTS feature_suggestions CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS gap_contributors CASCADE;
DROP TABLE IF EXISTS project_gaps CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Profiles table (extends auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  skills JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  project_filters JSONB,
  best_practice_filters JSONB,
  event_filters JSONB,
  notification_preferences JSONB DEFAULT '{
    "notify_feature_suggestion_added": true,
    "notify_feature_suggestion_comment_added": false,
    "notify_feedback_added": true,
    "notify_feedback_comment_added": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Projects table
-- -----------------------------------------------------------------------------
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  website_url TEXT,
  github_url TEXT,
  logo_url TEXT,
  owner_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('draft', 'idea', 'in_progress', 'on_hold', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Project gaps table
-- -----------------------------------------------------------------------------
CREATE TABLE project_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL CHECK (gap_type IN ('idea_assessment', 'ux_design', 'development', 'deployment', 'commercialization', 'marketing')),
  description TEXT,
  is_filled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Gap contributors table
-- -----------------------------------------------------------------------------
CREATE TABLE gap_contributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gap_id UUID NOT NULL REFERENCES project_gaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'helping', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(gap_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Feedback table (with threading support and titles)
-- -----------------------------------------------------------------------------
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  ai_enhanced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT feedback_title_check CHECK (
    (parent_id IS NULL AND title IS NOT NULL AND title != '')
    OR
    (parent_id IS NOT NULL)
  )
);

-- -----------------------------------------------------------------------------
-- Feedback votes table
-- -----------------------------------------------------------------------------
CREATE TABLE feedback_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Feature suggestions table
-- -----------------------------------------------------------------------------
CREATE TABLE feature_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Feature suggestion votes table
-- -----------------------------------------------------------------------------
CREATE TABLE feature_suggestion_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES feature_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Feature suggestion comments table
-- -----------------------------------------------------------------------------
CREATE TABLE feature_suggestion_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES feature_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES feature_suggestion_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Feature suggestion comment votes table
-- -----------------------------------------------------------------------------
CREATE TABLE feature_suggestion_comment_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES feature_suggestion_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Project updates table
-- -----------------------------------------------------------------------------
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Favorite projects table
-- -----------------------------------------------------------------------------
CREATE TABLE favorite_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- -----------------------------------------------------------------------------
-- AI settings table
-- -----------------------------------------------------------------------------
CREATE TABLE ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default AI settings
INSERT INTO ai_settings (model_name) VALUES ('claude-3-5-sonnet-20241022');

-- -----------------------------------------------------------------------------
-- AI usage logs table
-- -----------------------------------------------------------------------------
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Best practices table
-- -----------------------------------------------------------------------------
CREATE TABLE best_practices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'architecture', 'development', 'testing', 'deployment', 'security',
    'ux_design', 'performance', 'documentation', 'collaboration',
    'project_management', 'other'
  )),
  upvotes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Best practice comments table
-- -----------------------------------------------------------------------------
CREATE TABLE best_practice_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  best_practice_id UUID NOT NULL REFERENCES best_practices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Best practice requests table
-- -----------------------------------------------------------------------------
CREATE TABLE best_practice_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- App feedback table
-- -----------------------------------------------------------------------------
CREATE TABLE app_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- App feedback comments table
-- -----------------------------------------------------------------------------
CREATE TABLE app_feedback_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_feedback_id UUID NOT NULL REFERENCES app_feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Audit logs table (for Recent Events and admin auditing)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
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
    'feature_suggestion_created',
    'feature_suggestion_status_changed',
    'feedback_created',
    'feedback_comment_created'
  )),
  resource_type TEXT CHECK (resource_type IN (
    'project',
    'user',
    'auth',
    'settings',
    'feature_suggestion',
    'feedback'
  )),
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);

-- Projects indexes
CREATE INDEX idx_projects_owner_ids ON projects USING GIN(owner_ids);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);

-- Project gaps indexes
CREATE INDEX idx_project_gaps_project_id ON project_gaps(project_id);
CREATE INDEX idx_project_gaps_deleted_at ON project_gaps(deleted_at);

-- Gap contributors indexes
CREATE INDEX idx_gap_contributors_gap_id ON gap_contributors(gap_id);
CREATE INDEX idx_gap_contributors_user_id ON gap_contributors(user_id);
CREATE INDEX idx_gap_contributors_deleted_at ON gap_contributors(deleted_at);

-- Feedback indexes
CREATE INDEX idx_feedback_project_id ON feedback(project_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_parent_id ON feedback(parent_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_deleted_at ON feedback(deleted_at);

-- Feedback votes indexes
CREATE INDEX idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX idx_feedback_votes_user_id ON feedback_votes(user_id);

-- Feature suggestions indexes
CREATE INDEX idx_feature_suggestions_project_id ON feature_suggestions(project_id);
CREATE INDEX idx_feature_suggestions_user_id ON feature_suggestions(user_id);
CREATE INDEX idx_feature_suggestions_status ON feature_suggestions(status);
CREATE INDEX idx_feature_suggestions_deleted_at ON feature_suggestions(deleted_at);

-- Feature suggestion votes indexes
CREATE INDEX idx_feature_suggestion_votes_suggestion_id ON feature_suggestion_votes(suggestion_id);
CREATE INDEX idx_feature_suggestion_votes_user_id ON feature_suggestion_votes(user_id);

-- Feature suggestion comments indexes
CREATE INDEX idx_fs_comments_suggestion_id ON feature_suggestion_comments(suggestion_id);
CREATE INDEX idx_fs_comments_user_id ON feature_suggestion_comments(user_id);
CREATE INDEX idx_fs_comments_parent_id ON feature_suggestion_comments(parent_id);
CREATE INDEX idx_fs_comments_deleted_at ON feature_suggestion_comments(deleted_at);

-- Feature suggestion comment votes indexes
CREATE INDEX idx_fs_comment_votes_comment_id ON feature_suggestion_comment_votes(comment_id);
CREATE INDEX idx_fs_comment_votes_user_id ON feature_suggestion_comment_votes(user_id);

-- Project updates indexes
CREATE INDEX idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX idx_project_updates_created_at ON project_updates(created_at DESC);

-- Favorite projects indexes
CREATE INDEX idx_favorite_projects_user_id ON favorite_projects(user_id);
CREATE INDEX idx_favorite_projects_project_id ON favorite_projects(project_id);

-- AI usage logs indexes
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);

-- Best practices indexes
CREATE INDEX idx_best_practices_user_id ON best_practices(user_id);
CREATE INDEX idx_best_practices_category ON best_practices(category);
CREATE INDEX idx_best_practices_status ON best_practices(status);
CREATE INDEX idx_best_practices_created_at ON best_practices(created_at DESC);
CREATE INDEX idx_best_practices_deleted_at ON best_practices(deleted_at);

-- Best practice comments indexes
CREATE INDEX idx_bp_comments_best_practice_id ON best_practice_comments(best_practice_id);
CREATE INDEX idx_bp_comments_user_id ON best_practice_comments(user_id);
CREATE INDEX idx_bp_comments_deleted_at ON best_practice_comments(deleted_at);

-- Best practice requests indexes
CREATE INDEX idx_bp_requests_user_id ON best_practice_requests(user_id);
CREATE INDEX idx_bp_requests_status ON best_practice_requests(status);
CREATE INDEX idx_bp_requests_deleted_at ON best_practice_requests(deleted_at);

-- App feedback indexes
CREATE INDEX idx_app_feedback_user_id ON app_feedback(user_id);
CREATE INDEX idx_app_feedback_created_at ON app_feedback(created_at DESC);
CREATE INDEX idx_app_feedback_deleted_at ON app_feedback(deleted_at);

-- App feedback comments indexes
CREATE INDEX idx_app_feedback_comments_feedback_id ON app_feedback_comments(app_feedback_id);
CREATE INDEX idx_app_feedback_comments_user_id ON app_feedback_comments(user_id);
CREATE INDEX idx_app_feedback_comments_deleted_at ON app_feedback_comments(deleted_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);
CREATE INDEX idx_audit_logs_recent_events ON audit_logs(created_at DESC, action_type, resource_type)
  WHERE action_type IN ('project_created', 'user_signup', 'feature_suggestion_created', 'feedback_created');
CREATE INDEX idx_audit_logs_metadata_project_id ON audit_logs((metadata->>'project_id'))
  WHERE metadata ? 'project_id';

-- Notification preferences GIN index
CREATE INDEX idx_profiles_notification_preferences ON profiles USING GIN(notification_preferences);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestion_comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_practice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_practice_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Profiles RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Projects RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      status != 'draft'
      OR auth.uid() = ANY(owner_ids)
      OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = ANY(owner_ids));

CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  USING (auth.uid() = ANY(owner_ids));

CREATE POLICY "Project owners can delete their projects"
  ON projects FOR DELETE
  USING (auth.uid() = ANY(owner_ids));

-- -----------------------------------------------------------------------------
-- Project gaps RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Project gaps are viewable by everyone"
  ON project_gaps FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_gaps.project_id
      AND projects.deleted_at IS NULL
    )
  );

CREATE POLICY "Project owners can manage gaps"
  ON project_gaps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_gaps.project_id
      AND auth.uid() = ANY(projects.owner_ids)
    )
  );

-- -----------------------------------------------------------------------------
-- Gap contributors RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Gap contributors are viewable by everyone"
  ON gap_contributors FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Users can contribute to gaps"
  ON gap_contributors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own contributions"
  ON gap_contributors FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contributions"
  ON gap_contributors FOR UPDATE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Feedback RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Feedback is viewable by everyone"
  ON feedback FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON feedback FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Feedback votes RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Feedback votes are viewable by everyone"
  ON feedback_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on feedback"
  ON feedback_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON feedback_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON feedback_votes FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Feature suggestions RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Feature suggestions are viewable by everyone"
  ON feature_suggestions FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create suggestions"
  ON feature_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and project owners can update suggestions"
  ON feature_suggestions FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = feature_suggestions.project_id
      AND auth.uid() = ANY(projects.owner_ids)
    )
  );

-- -----------------------------------------------------------------------------
-- Feature suggestion votes RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Feature suggestion votes are viewable by everyone"
  ON feature_suggestion_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on suggestions"
  ON feature_suggestion_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON feature_suggestion_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON feature_suggestion_votes FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Feature suggestion comments RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Feature suggestion comments are viewable by everyone"
  ON feature_suggestion_comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create comments"
  ON feature_suggestion_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON feature_suggestion_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON feature_suggestion_comments FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Feature suggestion comment votes RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Comment votes are viewable by everyone"
  ON feature_suggestion_comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on comments"
  ON feature_suggestion_comment_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON feature_suggestion_comment_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON feature_suggestion_comment_votes FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Project updates RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Project updates are viewable by everyone"
  ON project_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND projects.deleted_at IS NULL
    )
  );

CREATE POLICY "Project owners can create updates"
  ON project_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND auth.uid() = ANY(projects.owner_ids)
    )
  );

-- -----------------------------------------------------------------------------
-- Favorite projects RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view all favorites"
  ON favorite_projects FOR SELECT
  USING (true);

CREATE POLICY "Users can favorite projects"
  ON favorite_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfavorite projects"
  ON favorite_projects FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- AI settings RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Everyone can view AI settings"
  ON ai_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update AI settings"
  ON ai_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- AI usage logs RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own usage logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all usage logs"
  ON ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- Best practices RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Published best practices are viewable by everyone"
  ON best_practices FOR SELECT
  USING (
    deleted_at IS NULL
    AND (status = 'published' OR auth.uid() = user_id)
  );

CREATE POLICY "Authenticated users can create best practices"
  ON best_practices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own best practices"
  ON best_practices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own best practices"
  ON best_practices FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Best practice comments RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Best practice comments are viewable by everyone"
  ON best_practice_comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create comments"
  ON best_practice_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON best_practice_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON best_practice_comments FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Best practice requests RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Best practice requests are viewable by everyone"
  ON best_practice_requests FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create requests"
  ON best_practice_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON best_practice_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- App feedback RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "App feedback is viewable by everyone"
  ON app_feedback FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create app feedback"
  ON app_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app feedback"
  ON app_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- App feedback comments RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "App feedback comments are viewable by everyone"
  ON app_feedback_comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create comments"
  ON app_feedback_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON app_feedback_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Audit logs RLS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view recent events"
  ON audit_logs FOR SELECT
  USING (
    (resource_type IN ('project', 'feature_suggestion', 'feedback') AND action_type IN (
      'project_created',
      'feature_suggestion_created',
      'feedback_created'
    ))
    OR
    (resource_type = 'auth' AND action_type = 'user_signup')
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_suggestions_updated_at BEFORE UPDATE ON feature_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_best_practices_updated_at BEFORE UPDATE ON best_practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_feedback_updated_at BEFORE UPDATE ON app_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Schema creation complete!
-- You can now use the application with full functionality including:
-- - Projects with gaps and contributors
-- - Feedback with threading and votes
-- - Feature suggestions with comments and votes
-- - Best practices with comments and requests
-- - App feedback system
-- - Recent Events page with audit logging
-- - AI usage tracking
-- - User profiles with notification preferences
-- - Favorite projects
-- - Project updates
