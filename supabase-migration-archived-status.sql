-- Migration: Add archive status to projects
-- Date: 2025-12-19
-- Description: Adds 'archived' status to projects and updates RLS policy to restrict visibility

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

-- Step 2: Add new CHECK constraint with 'archived'
ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'idea', 'in_progress', 'seeking_help', 'on_hold', 'completed', 'archived'));

-- Step 3: Drop old RLS policy
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON projects;

-- Step 4: Create new RLS policy with archive visibility rules
CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  USING (
    deleted_at IS NULL AND (
      -- Draft projects: only owners can see
      (status = 'draft' AND auth.uid() = ANY(owner_ids)) OR
      -- Archived projects: only owners and admins can see
      (status = 'archived' AND (
        auth.uid() = ANY(owner_ids) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )) OR
      -- All other statuses: public
      (status NOT IN ('draft', 'archived'))
    )
  );
