-- Recreate the function if it doesn't exist
CREATE OR REPLACE FUNCTION public.user_is_security_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = auth.uid()
    AND role = 'security_admin'
  )
$$;

-- Fix bootstrap problem: Allow users to create projects if they have no project memberships yet
DROP POLICY IF EXISTS "Security admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their first project or security admins can create projects" ON public.projects;

CREATE POLICY "Users can create their first project or security admins can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  -- User is a security admin in at least one project
  public.user_is_security_admin()
  OR
  -- User has no project memberships yet (first project)
  NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = auth.uid()
  )
);