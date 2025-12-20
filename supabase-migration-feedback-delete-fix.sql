-- Fix RLS policy for soft deleting feedback
-- This adds an explicit WITH CHECK clause to allow setting deleted_at

-- Drop the existing soft delete policy
DROP POLICY IF EXISTS "Users can soft delete their own feedback" ON feedback;

-- Recreate with explicit WITH CHECK clause
CREATE POLICY "Users can soft delete their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
