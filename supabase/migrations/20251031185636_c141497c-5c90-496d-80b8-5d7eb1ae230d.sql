-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow creator to be added as risk owner" ON public.project_members;

-- Recreate the trigger function with explicit RLS bypass
CREATE OR REPLACE FUNCTION public.add_creator_as_risk_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'risk_owner');
  RETURN NEW;
END;
$$;