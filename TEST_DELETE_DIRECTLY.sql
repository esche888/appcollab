-- Test deleting feedback directly in SQL
-- Run this in your Supabase SQL Editor

-- First, let's see a feedback item
SELECT id, user_id, content, deleted_at, parent_id
FROM feedback
WHERE id = '544fd939-5fd9-4189-b470-391a605381a0';

-- Now try to update it
UPDATE feedback
SET deleted_at = NOW()
WHERE id = '544fd939-5fd9-4189-b470-391a605381a0';

-- Check if it worked
SELECT id, user_id, content, deleted_at, parent_id
FROM feedback
WHERE id = '544fd939-5fd9-4189-b470-391a605381a0';
