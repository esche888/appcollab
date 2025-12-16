-- Migration to add threading support to feedback
-- Run this in your Supabase SQL Editor

-- Add parent_id column to feedback table for threading
ALTER TABLE feedback ADD COLUMN parent_id UUID REFERENCES feedback(id) ON DELETE CASCADE;

-- Add index for better performance on threaded queries
CREATE INDEX idx_feedback_parent_id ON feedback(parent_id) WHERE deleted_at IS NULL;

-- Update the RLS policy to allow users to reply to feedback
-- (The existing policies should already cover this, but let's ensure it's clear)
