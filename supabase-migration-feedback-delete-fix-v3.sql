-- Fix RLS policies for feedback to allow soft deletion
-- Replace multiple UPDATE policies with a single comprehensive one

-- Drop existing update policies
DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can soft delete their own feedback" ON feedback;

-- Single policy that allows both regular updates and soft deletion
-- USING checks the old row, WITH CHECK checks the new row
CREATE POLICY "Users can update and delete their own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
