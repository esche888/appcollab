-- AppCollab Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  skills JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  owner_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'in_progress', 'seeking_help', 'on_hold', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Project gaps table
CREATE TABLE project_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL CHECK (gap_type IN ('idea_assessment', 'ux_design', 'development', 'deployment', 'commercialization', 'marketing')),
  description TEXT,
  is_filled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Gap contributors table
CREATE TABLE gap_contributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gap_id UUID NOT NULL REFERENCES project_gaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'helping', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(gap_id, user_id)
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_enhanced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Feature suggestions table
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

-- AI settings table
CREATE TABLE ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  active_model TEXT NOT NULL CHECK (active_model IN ('chatgpt', 'gemini', 'claude')),
  model_config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- AI usage logs table
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  model_used TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time_ms INTEGER NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_owner_ids ON projects USING GIN(owner_ids);
CREATE INDEX idx_project_gaps_project_id ON project_gaps(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gap_contributors_gap_id ON gap_contributors(gap_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gap_contributors_user_id ON gap_contributors(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_feedback_project_id ON feedback(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_feature_suggestions_project_id ON feature_suggestions(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_timestamp ON ai_usage_logs(request_timestamp DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_suggestions_updated_at BEFORE UPDATE ON feature_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL);

-- Projects policies
CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = ANY(owner_ids));

CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  USING (auth.uid() = ANY(owner_ids) AND deleted_at IS NULL);

CREATE POLICY "Project owners can soft delete their projects"
  ON projects FOR UPDATE
  USING (auth.uid() = ANY(owner_ids))
  WITH CHECK (deleted_at IS NOT NULL OR auth.uid() = ANY(owner_ids));

-- Project gaps policies
CREATE POLICY "Gaps are viewable by everyone"
  ON project_gaps FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Project owners can manage gaps"
  ON project_gaps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_gaps.project_id
      AND auth.uid() = ANY(projects.owner_ids)
    )
  );

-- Gap contributors policies
CREATE POLICY "Contributors are viewable by everyone"
  ON gap_contributors FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can tag themselves"
  ON gap_contributors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contributions"
  ON gap_contributors FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can remove their contributions"
  ON gap_contributors FOR UPDATE
  USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Feedback is viewable by everyone"
  ON feedback FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Feature suggestions policies
CREATE POLICY "Feature suggestions are viewable by everyone"
  ON feature_suggestions FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create suggestions"
  ON feature_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions"
  ON feature_suggestions FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Project owners can update suggestion status"
  ON feature_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = feature_suggestions.project_id
      AND auth.uid() = ANY(projects.owner_ids)
    )
  );

-- AI settings policies (admin only)
CREATE POLICY "AI settings viewable by admins"
  ON ai_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "AI settings manageable by admins"
  ON ai_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- AI usage logs policies
CREATE POLICY "Users can view their own usage logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs"
  ON ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- Insert default AI settings
INSERT INTO ai_settings (active_model, model_config)
VALUES ('chatgpt', '{"model": "gpt-4-turbo-preview", "temperature": 0.7}'::jsonb)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
