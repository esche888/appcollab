-- ============================================================================
-- IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================================================
-- This fixes the RLS policy to allow soft deletion of feedback

-- Step 1: Check current policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'feedback' AND cmd = 'UPDATE';

-- Step 2: Drop all existing UPDATE policies on feedback
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can soft delete their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update and delete their own feedback" ON feedback;

-- Step 3: Create the new comprehensive policy
CREATE POLICY "Users can update and delete their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Verify the new policy
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'feedback' AND cmd = 'UPDATE';
