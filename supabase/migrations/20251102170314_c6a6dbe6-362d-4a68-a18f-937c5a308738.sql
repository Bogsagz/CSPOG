-- Add policy to allow security admins to view all user deliverables
CREATE POLICY "Security admins can view all deliverables"
ON public.user_deliverables
FOR SELECT
TO authenticated
USING (user_is_security_admin());