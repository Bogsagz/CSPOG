-- Replace function to bypass RLS while still admin-gated
CREATE OR REPLACE FUNCTION public.get_remaining_capacity()
RETURNS TABLE (
  user_id uuid,
  remaining_capacity numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  -- Allow only security admins to execute
  IF NOT user_is_security_admin() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT p.id AS user_id,
         GREATEST(0, LEAST(100, 100 - COALESCE(SUM(a.allocation_percentage), 0))) AS remaining_capacity
  FROM profiles p
  LEFT JOIN project_time_allocation a ON a.user_id = p.id
  WHERE p.disabled = false
  GROUP BY p.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_remaining_capacity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_remaining_capacity() TO authenticated;