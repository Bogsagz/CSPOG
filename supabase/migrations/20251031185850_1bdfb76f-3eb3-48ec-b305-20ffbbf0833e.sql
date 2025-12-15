-- Add a second policy specifically for security admins
CREATE POLICY "Security admins can create any project"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_is_security_admin());