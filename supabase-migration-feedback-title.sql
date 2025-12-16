-- Migration to add title support to feedback threads
-- Run this in your Supabase SQL Editor

-- Add title column to feedback table (only used for top-level comments)
ALTER TABLE feedback ADD COLUMN title TEXT;

-- Add constraint: top-level feedback (parent_id IS NULL) must have a title
-- Replies (parent_id IS NOT NULL) don't need a title
ALTER TABLE feedback ADD CONSTRAINT feedback_title_check
  CHECK (
    (parent_id IS NULL AND title IS NOT NULL AND title != '')
    OR
    (parent_id IS NOT NULL)
  );
