-- 1. Add committed_hours to join_requests
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS committed_hours INTEGER DEFAULT 0;

-- 2. Function to add a team member safely (bypassing basic RLS for "system" actions triggered by owner)
CREATE OR REPLACE FUNCTION add_team_member(
  p_initiative_id text,
  p_user_id text,
  p_committed_hours int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the executor is the owner of the initiative
  IF EXISTS (
    SELECT 1 FROM initiatives 
    WHERE id = p_initiative_id AND owner_id = auth.uid()::text
  ) THEN
    INSERT INTO initiative_team_members (initiative_id, user_id, committed_hours)
    VALUES (p_initiative_id, p_user_id, p_committed_hours)
    ON CONFLICT (initiative_id, user_id) DO UPDATE
    SET committed_hours = p_committed_hours;
    RETURN;
  END IF;

  -- Allow users to add themselves (e.g. for "Join" button or accepting invite)
  IF auth.uid()::text = p_user_id THEN
    INSERT INTO initiative_team_members (initiative_id, user_id, committed_hours)
    VALUES (p_initiative_id, p_user_id, p_committed_hours)
    ON CONFLICT (initiative_id, user_id) DO UPDATE
    SET committed_hours = p_committed_hours;
    RETURN;
  END IF;

  RAISE EXCEPTION 'Not authorized to add team member';
END;
$$;

