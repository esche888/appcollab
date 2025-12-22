-- Fix RLS policy conflict preventing project soft deletion
--
-- THE PROBLEM:
-- Two UPDATE policies exist with conflicting WITH CHECK clauses:
-- 1. "Project owners can update their projects" has implicit WITH CHECK:
--    auth.uid() = ANY(owner_ids) AND deleted_at IS NULL
-- 2. "Project owners can soft delete their projects" has WITH CHECK:
--    deleted_at IS NOT NULL OR auth.uid() = ANY(owner_ids)
--
-- When soft deleting (setting deleted_at), policy #1 fails because deleted_at IS NOT NULL
-- Both policies must pass for UPDATE to succeed, so the operation fails.
--
-- SOLUTION: Replace both with a single policy that doesn't restrict deleted_at

-- Step 1: Drop the conflicting policies
DROP POLICY IF EXISTS "Project owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Project owners can soft delete their projects" ON projects;

-- Step 2: Create a single comprehensive UPDATE policy
-- This allows owners to update any field, including soft delete via deleted_at
CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  USING (
    -- User must be an owner to perform the update (checks OLD row)
    auth.uid() = ANY(owner_ids)
  )
  WITH CHECK (
    -- User must still be an owner after the update (checks NEW row)
    -- We don't check deleted_at here, allowing it to be set to any value
    auth.uid() = ANY(owner_ids)
  );

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'projects'
AND cmd = 'UPDATE';
