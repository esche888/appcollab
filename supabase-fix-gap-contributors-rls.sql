-- Fix RLS policies for gap_contributors to allow soft delete
-- The previous policy likely included "deleted_at IS NULL" in the check, preventing the update to set deleted_at.

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Users can update their own contributions" ON public.gap_contributors;
DROP POLICY IF EXISTS "Users can remove their contributions" ON public.gap_contributors;

-- Create a comprehensive policy for users to manage their own contributions
-- This allows updating the row (including soft deletion) as long as they own it
CREATE POLICY "Users can manage their own contributions"
  ON public.gap_contributors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also ensure they can insert (this might already exist but good to be safe/consistent if we were doing a full reset, but here just fixing UPDATE is enough)
-- existing INSERT policy: "Authenticated users can tag themselves" WITH CHECK (auth.uid() = user_id);
