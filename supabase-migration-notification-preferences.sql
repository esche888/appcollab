-- Migration: Add notification preferences to profiles table
-- Description: Adds a JSONB column to store user email notification preferences
-- Date: 2025-12-23

-- Add notification preferences column with default values
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "notify_feature_suggestion_added": true,
  "notify_feature_suggestion_comment_added": false,
  "notify_feedback_added": true,
  "notify_feedback_comment_added": false
}'::jsonb;

-- Add GIN index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences
ON profiles USING gin (notification_preferences);

-- Update existing profiles to have default preferences (for any NULL values)
UPDATE profiles
SET notification_preferences = '{
  "notify_feature_suggestion_added": true,
  "notify_feature_suggestion_comment_added": false,
  "notify_feedback_added": true,
  "notify_feedback_comment_added": false
}'::jsonb
WHERE notification_preferences IS NULL;

-- Add NOT NULL constraint after setting defaults
ALTER TABLE profiles
ALTER COLUMN notification_preferences SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_preferences IS 'JSONB object storing user email notification preferences for project ownership events';
