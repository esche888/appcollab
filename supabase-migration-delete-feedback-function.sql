-- Create a function to soft delete feedback
-- This runs with SECURITY DEFINER which bypasses RLS
CREATE OR REPLACE FUNCTION soft_delete_feedback(feedback_id UUID, requesting_user_id UUID)
RETURNS JSON AS $$
DECLARE
  feedback_record RECORD;
  result JSON;
BEGIN
  -- Check if feedback exists and belongs to user
  SELECT * INTO feedback_record
  FROM feedback
  WHERE id = feedback_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Feedback not found');
  END IF;

  IF feedback_record.user_id != requesting_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF feedback_record.deleted_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already deleted');
  END IF;

  -- Perform the soft delete
  UPDATE feedback
  SET deleted_at = NOW()
  WHERE id = feedback_id;

  -- Return the updated record
  SELECT json_build_object(
    'success', true,
    'data', row_to_json(feedback.*)
  ) INTO result
  FROM feedback
  WHERE id = feedback_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_feedback(UUID, UUID) TO authenticated;
