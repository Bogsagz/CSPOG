-- Add SFIA grade and primary role to profiles
ALTER TABLE public.profiles
ADD COLUMN sfia_grade integer CHECK (sfia_grade >= 3 AND sfia_grade <= 5),
ADD COLUMN primary_role project_role;

-- Add RLS policy for security admins to update profiles
CREATE POLICY "Security admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_is_security_admin())
WITH CHECK (user_is_security_admin());