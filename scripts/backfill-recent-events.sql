-- Script to backfill recent events from existing data
-- This creates audit log entries for existing projects, feature suggestions, and feedback

-- Backfill project creation events (from existing projects)
INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, metadata, created_at)
SELECT
  owner_ids[1] as user_id,  -- Use first owner as the creator
  'project_created' as action_type,
  'project' as resource_type,
  id as resource_id,
  jsonb_build_object(
    'project_id', id,
    'project_title', title,
    'status', status
  ) as metadata,
  created_at
FROM projects
WHERE deleted_at IS NULL
AND created_at > NOW() - INTERVAL '30 days'  -- Only backfill last 30 days
ON CONFLICT DO NOTHING;

-- Backfill feature suggestion events (from existing suggestions)
INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, metadata, created_at)
SELECT
  fs.user_id,
  'feature_suggestion_created' as action_type,
  'feature_suggestion' as resource_type,
  fs.id as resource_id,
  jsonb_build_object(
    'project_id', fs.project_id,
    'project_title', p.title,
    'suggestion_title', fs.title,
    'suggestion_description', LEFT(fs.description, 200)
  ) as metadata,
  fs.created_at
FROM feature_suggestions fs
JOIN projects p ON p.id = fs.project_id
WHERE fs.deleted_at IS NULL
AND fs.created_at > NOW() - INTERVAL '30 days'  -- Only backfill last 30 days
ON CONFLICT DO NOTHING;

-- Backfill feedback events (from existing top-level feedback only)
INSERT INTO audit_logs (user_id, action_type, resource_type, resource_id, metadata, created_at)
SELECT
  f.user_id,
  'feedback_created' as action_type,
  'feedback' as resource_type,
  f.id as resource_id,
  jsonb_build_object(
    'project_id', f.project_id,
    'project_title', p.title,
    'feedback_title', f.title,
    'feedback_content', LEFT(f.content, 200)
  ) as metadata,
  f.created_at
FROM feedback f
JOIN projects p ON p.id = f.project_id
WHERE f.deleted_at IS NULL
AND f.parent_id IS NULL  -- Only top-level feedback, not replies
AND f.created_at > NOW() - INTERVAL '30 days'  -- Only backfill last 30 days
ON CONFLICT DO NOTHING;

-- Show count of events created
SELECT
  action_type,
  COUNT(*) as event_count
FROM audit_logs
GROUP BY action_type
ORDER BY action_type;
