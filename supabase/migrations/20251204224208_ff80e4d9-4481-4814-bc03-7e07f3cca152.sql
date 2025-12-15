-- Fix function search_path for get_system_role_for_org_role
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
$function$;