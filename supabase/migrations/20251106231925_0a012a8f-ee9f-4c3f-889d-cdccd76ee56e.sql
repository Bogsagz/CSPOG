-- Fix infinite recursion by recreating functions and policies in correct order

-- Drop all dependent policies first
DROP POLICY IF EXISTS "Users can view profiles in their workstream" ON public.profiles;
DROP POLICY IF EXISTS "Users can view projects in their workstream" ON public.projects;
DROP POLICY IF EXISTS "Users can view team leave in their workstream" ON public.team_leave;
DROP POLICY IF EXISTS "Users can view deliverables in their workstream" ON public.user_deliverables;

-- Now drop the functions
DROP FUNCTION IF EXISTS public.user_can_view_workstream_data(uuid, workstream);
DROP FUNCTION IF EXISTS public.user_can_view_project_in_workstream(uuid, uuid);

-- Recreate user_can_view_workstream_data with row_security off
CREATE OR REPLACE FUNCTION public.user_can_view_workstream_data(_user_id uuid, _workstream workstream)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
SET row_security TO 'off'
AS $$
BEGIN
  -- Allow if user is a security admin or delivery
  IF user_is_security_admin() THEN
    RETURN true;
  END IF;
  
  -- Allow if user's workstream matches
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
    AND workstream = _workstream
  );
END;
$$;

-- Recreate user_can_view_project_in_workstream with row_security off
CREATE OR REPLACE FUNCTION public.user_can_view_project_in_workstream(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
SET row_security TO 'off'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    INNER JOIN public.profiles prof ON prof.id = _user_id
    WHERE p.id = _project_id
    AND p.workstream = prof.workstream
  );
END;
$$;

-- Recreate all policies
CREATE POLICY "Users can view profiles in their workstream"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_is_security_admin()
  OR auth.uid() = id
  OR user_can_view_workstream_data(auth.uid(), workstream)
);

CREATE POLICY "Users can view projects in their workstream"
ON public.projects
FOR SELECT
TO authenticated
USING (
  user_is_security_admin()
  OR user_can_view_project_in_workstream(auth.uid(), id)
);

CREATE POLICY "Users can view team leave in their workstream"
ON public.team_leave
FOR SELECT
TO authenticated
USING (
  user_is_security_admin()
  OR user_has_project_access(auth.uid(), project_id)
  OR user_can_view_project_in_workstream(auth.uid(), project_id)
);

CREATE POLICY "Users can view deliverables in their workstream"
ON public.user_deliverables
FOR SELECT
TO authenticated
USING (
  user_is_security_admin()
  OR auth.uid() = user_id
  OR user_has_project_access(auth.uid(), project_id)
  OR user_can_view_project_in_workstream(auth.uid(), project_id)
);