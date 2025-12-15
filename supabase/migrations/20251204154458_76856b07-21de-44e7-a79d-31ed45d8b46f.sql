CREATE OR REPLACE FUNCTION public.user_can_write_risk_appetite(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
    AND role IN ('risk_manager', 'security_architect')
  ) OR user_is_security_admin()
$$;