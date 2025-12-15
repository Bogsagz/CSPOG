-- Remove ia_mentor from organizational_role enum
-- Drop dependent objects first

-- Drop the dependent trigger
DROP TRIGGER IF EXISTS sync_system_role_on_org_role_change ON public.profiles;

-- Drop the dependent function
DROP FUNCTION IF EXISTS public.get_system_role_for_org_role(organizational_role);

-- Create a new enum type without ia_mentor
CREATE TYPE organizational_role_new AS ENUM (
  'delivery',
  'sa_mentor',
  'security_architect',
  'risk_manager',
  'sec_mon',
  'sec_eng',
  'admin'
);

-- Update the profiles table to use the new enum
ALTER TABLE public.profiles 
  ALTER COLUMN primary_role TYPE organizational_role_new 
  USING primary_role::text::organizational_role_new;

-- Drop the old enum type
DROP TYPE organizational_role;

-- Rename the new enum to the original name
ALTER TYPE organizational_role_new RENAME TO organizational_role;

-- Recreate the function with updated enum (without ia_mentor)
CREATE OR REPLACE FUNCTION public.get_system_role_for_org_role(org_role organizational_role)
 RETURNS app_role
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  CASE org_role
    WHEN 'delivery' THEN
      RETURN 'security_delivery'::app_role;
    WHEN 'sa_mentor' THEN
      RETURN 'security_mentor'::app_role;
    WHEN 'security_architect', 'risk_manager', 'sec_mon', 'sec_eng' THEN
      RETURN 'security_user'::app_role;
    WHEN 'admin' THEN
      RETURN 'security_admin'::app_role;
    ELSE
      RETURN 'security_user'::app_role;
  END CASE;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER sync_system_role_on_org_role_change
  AFTER INSERT OR UPDATE OF primary_role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_system_authorization_role();