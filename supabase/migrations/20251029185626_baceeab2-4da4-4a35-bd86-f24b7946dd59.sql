-- Drop the risk owner delete policy
DROP POLICY IF EXISTS "Risk owners can delete projects" ON public.projects;

-- Only security admins should be able to delete projects
CREATE POLICY "Only security admins can delete projects"
ON public.projects
FOR DELETE
USING (user_is_security_admin());