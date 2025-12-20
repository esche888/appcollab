-- Fix RLS policies for feedback to allow soft deletion
-- The issue is that the "Users can update their own feedback" policy
-- has an implicit WITH CHECK that requires deleted_at IS NULL,
-- which prevents soft deletion.

-- Drop existing update policies
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can soft delete their own feedback" ON feedback;

-- Recreate with proper WITH CHECK clauses
-- This policy allows updating content/title of non-deleted feedback
CREATE POLICY "Users can update their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- This policy allows setting deleted_at (soft delete)
CREATE POLICY "Users can soft delete their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);
