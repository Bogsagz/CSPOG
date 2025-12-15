-- Allow security admins to manage project members
CREATE POLICY "Security admins can insert project members"
ON public.project_members
FOR INSERT
TO authenticated
WITH CHECK (user_is_security_admin());

CREATE POLICY "Security admins can update project members"
ON public.project_members
FOR UPDATE
TO authenticated
USING (user_is_security_admin())
WITH CHECK (user_is_security_admin());

CREATE POLICY "Security admins can delete project members"
ON public.project_members
FOR DELETE
TO authenticated
USING (user_is_security_admin());