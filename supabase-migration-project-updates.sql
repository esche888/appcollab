-- Create project_updates table
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_deleted_at ON project_updates(deleted_at);

-- Enable RLS
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view non-deleted updates
CREATE POLICY "Anyone can view project updates"
  ON project_updates
  FOR SELECT
  USING (deleted_at IS NULL);

-- Only project owners can create updates
CREATE POLICY "Project owners can create updates"
  ON project_updates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_updates.project_id
      AND auth.uid() = ANY(projects.owner_ids)
    )
  );

-- Only the creator can delete their own updates
CREATE POLICY "Creators can delete their updates"
  ON project_updates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
