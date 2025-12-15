-- Update the user_is_security_admin function to include security_delivery
CREATE OR REPLACE FUNCTION public.user_is_security_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'security_admin'::app_role) 
      OR public.has_role(auth.uid(), 'security_delivery'::app_role)
$$;