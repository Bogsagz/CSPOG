-- Add policy to allow security admins to view all profiles
CREATE POLICY "Security admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_is_security_admin());