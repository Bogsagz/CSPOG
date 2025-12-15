-- Fix database functions to use correct project_role enum values
-- Replace 'risk_owner' with 'risk_manager' and remove invalid role checks

CREATE OR REPLACE FUNCTION public.user_can_write_tables(_user_id uuid, _project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
    AND role IN ('risk_manager', 'security_architect', 'delivery')
  ) OR user_is_security_admin()
$function$;

CREATE OR REPLACE FUNCTION public.user_can_write_threats(_user_id uuid, _project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
    AND role IN ('risk_manager', 'security_architect', 'sec_mon')
  ) OR user_is_security_admin()
$function$;

CREATE OR REPLACE FUNCTION public.user_can_write_risk_appetite(_user_id uuid, _project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
    AND role IN ('risk_manager', 'security_architect')
  ) OR user_is_security_admin()
$function$;