-- Migration: Allow invite code lookup for join flow
-- This function allows authenticated users to lookup a group by invite code
-- without requiring group membership (needed for the join flow)

-- Function to safely lookup group by invite code (returns minimal data)
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(code TEXT)
RETURNS TABLE (id UUID, name TEXT)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name
  FROM public.groups g
  WHERE g.invite_code = UPPER(code);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(TEXT) TO authenticated;
