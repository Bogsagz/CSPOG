-- Allow security admins to view all project members
CREATE POLICY "Security admins can view all project members"
ON public.project_members
FOR SELECT
TO authenticated
USING (user_is_security_admin());