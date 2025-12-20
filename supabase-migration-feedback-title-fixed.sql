-- Migration to add title support to feedback threads
-- This version handles existing data

-- Step 1: Add title column if it doesn't exist
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS title TEXT;

-- Step 2: Update existing top-level feedback to have a title
-- (Set title to first 100 characters of content for existing records)
UPDATE feedback
SET title = SUBSTRING(content, 1, 100)
WHERE parent_id IS NULL AND (title IS NULL OR title = '');

-- Step 3: Drop the constraint if it exists
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_title_check;

-- Step 4: Add the constraint
ALTER TABLE feedback ADD CONSTRAINT feedback_title_check
  CHECK (
    (parent_id IS NULL AND title IS NOT NULL AND title != '')
    OR
    (parent_id IS NOT NULL)
  );
