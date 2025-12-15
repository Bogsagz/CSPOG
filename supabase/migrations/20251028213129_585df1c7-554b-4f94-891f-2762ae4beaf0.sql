-- Only Security Admins can create projects (no exceptions)
DROP POLICY IF EXISTS "Users can create their first project or security admins can create projects" ON public.projects;

CREATE POLICY "Only security admins can create projects"
ON public.projects
FOR INSERT
WITH CHECK (public.user_is_security_admin());