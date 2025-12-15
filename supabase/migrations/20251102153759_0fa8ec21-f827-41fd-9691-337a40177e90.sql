-- Add policy for security admins to view all projects
CREATE POLICY "Security admins can view all projects"
ON public.projects
FOR SELECT
USING (user_is_security_admin());