-- Add filter preference columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS project_filters JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS best_practice_filters JSONB DEFAULT '{}'::jsonb;
