-- Allow users to delete their own contributions (Hard Delete)
-- This replaces the soft-delete approach which was causing RLS friction.

CREATE POLICY "Users can delete their own contributions"
  ON public.gap_contributors FOR DELETE
  USING (auth.uid() = user_id);
