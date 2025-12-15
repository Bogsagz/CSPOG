-- Function to get system authorization role based on organizational role
CREATE OR REPLACE FUNCTION public.get_system_role_for_org_role(org_role organizational_role)
RETURNS app_role
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE org_role
    WHEN 'delivery' THEN
      RETURN 'security_delivery'::app_role;
    WHEN 'sa_mentor', 'ia_mentor' THEN
      RETURN 'security_mentor'::app_role;
    WHEN 'security_architect', 'risk_manager', 'sec_mon', 'sec_eng' THEN
      RETURN 'security_user'::app_role;
    WHEN 'admin' THEN
      RETURN 'security_admin'::app_role;
    ELSE
      RETURN 'security_user'::app_role;
  END CASE;
END;
$$;

-- Function to sync system authorization role when organizational role changes
CREATE OR REPLACE FUNCTION public.sync_system_authorization_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_system_role app_role;
  old_system_role app_role;
BEGIN
  -- Get the new system role based on organizational role
  new_system_role := public.get_system_role_for_org_role(NEW.primary_role);
  
  -- If updating and organizational role changed
  IF TG_OP = 'UPDATE' AND OLD.primary_role IS DISTINCT FROM NEW.primary_role THEN
    -- Get the old system role
    old_system_role := public.get_system_role_for_org_role(OLD.primary_role);
    
    -- Remove old system role if it was auto-assigned
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id
      AND role = old_system_role;
  END IF;
  
  -- Insert new system role if not already present
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_system_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync system roles
DROP TRIGGER IF EXISTS sync_system_role_on_org_role_change ON public.profiles;
CREATE TRIGGER sync_system_role_on_org_role_change
  AFTER INSERT OR UPDATE OF primary_role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.primary_role IS NOT NULL)
  EXECUTE FUNCTION public.sync_system_authorization_role();

-- Populate system authorization roles for all existing users based on their organizational roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.id,
  public.get_system_role_for_org_role(p.primary_role)
FROM public.profiles p
WHERE p.primary_role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;