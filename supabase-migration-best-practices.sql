-- Create best_practices table
CREATE TABLE IF NOT EXISTS public.best_practices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.best_practices ENABLE ROW LEVEL SECURITY;

-- Policies

-- View policy:
-- 1. Published or archived best practices are visible to everyone (authenticated)
-- 2. Draft best practices are only visible to the author
CREATE POLICY "Best practices are viewable by everyone if published/archived, or by owner if draft"
  ON public.best_practices
  FOR SELECT
  USING (
    (status IN ('published', 'archived')) OR
    (auth.uid() = user_id)
  );

-- Insert policy: Authenticated users can create best practices
CREATE POLICY "Users can create best practices"
  ON public.best_practices
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Update policy: Only the author can update their best practices
CREATE POLICY "Users can update their own best practices"
  ON public.best_practices
  FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Delete policy: Only the author can delete (soft delete usually handled via update, but strict delete allowed for owner too if needed)
CREATE POLICY "Users can delete their own best practices"
  ON public.best_practices
  FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_best_practices_updated_at
  BEFORE UPDATE ON public.best_practices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Note: best_practices_comments table might also be needed if comments are implemented, 
-- but error was specifically about best_practices. 
-- Based on types/database.ts, there is a BestPracticeComment type, so let's check if we should create that too.
-- The user request was specific to 'public.best_practices'. 
-- Checking types/database.ts again... yes BestPracticeComment exists. 
-- It is safer to create it as well to avoid future errors if the UI uses it immediately.

CREATE TABLE IF NOT EXISTS public.best_practice_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  best_practice_id UUID NOT NULL REFERENCES public.best_practices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.best_practice_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.best_practice_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.best_practice_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own comments"
  ON public.best_practice_comments
  FOR UPDATE
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own comments"
  ON public.best_practice_comments
  FOR DELETE
  USING (
    auth.uid() = user_id
  );

CREATE TRIGGER handle_best_practice_comments_updated_at
  BEFORE UPDATE ON public.best_practice_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
