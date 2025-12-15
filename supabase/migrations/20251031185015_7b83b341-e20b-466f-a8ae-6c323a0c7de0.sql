-- Drop the conflicting restrictive policies
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Only security admins can create projects" ON public.projects;

-- Create a single permissive policy that allows both security admins and users to create projects
CREATE POLICY "Users and security admins can create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR user_is_security_admin()
  );