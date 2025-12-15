-- Function to check if user can view workstream data
CREATE OR REPLACE FUNCTION public.user_can_view_workstream_data(_user_id uuid, _workstream workstream)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Allow if user is a security admin or delivery
  SELECT user_is_security_admin()
  OR
  -- Allow if user's workstream matches
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
    AND workstream = _workstream
  )
$$;

-- Function to check if user can view project in their workstream
CREATE OR REPLACE FUNCTION public.user_can_view_project_in_workstream(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    INNER JOIN public.profiles prof ON prof.id = _user_id
    WHERE p.id = _project_id
    AND p.workstream = prof.workstream
  )
$$;

-- Add policies for workstream-wide visibility on projects
DROP POLICY IF EXISTS "Users can view projects in their workstream" ON public.projects;
CREATE POLICY "Users can view projects in their workstream"
ON public.projects
FOR SELECT
TO authenticated
USING (
  user_can_view_project_in_workstream(auth.uid(), id)
);

-- Add policies for workstream-wide visibility on profiles
DROP POLICY IF EXISTS "Users can view profiles in their workstream" ON public.profiles;
CREATE POLICY "Users can view profiles in their workstream"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_is_security_admin()
  OR auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.workstream = profiles.workstream
  )
);

-- Add policies for workstream-wide visibility on team_leave
DROP POLICY IF EXISTS "Users can view team leave in their workstream" ON public.team_leave;
CREATE POLICY "Users can view team leave in their workstream"
ON public.team_leave
FOR SELECT
TO authenticated
USING (
  user_is_security_admin()
  OR user_has_project_access(auth.uid(), project_id)
  OR user_can_view_project_in_workstream(auth.uid(), project_id)
);

-- Add policies for workstream-wide visibility on user_deliverables
DROP POLICY IF EXISTS "Users can view deliverables in their workstream" ON public.user_deliverables;
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