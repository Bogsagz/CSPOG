CREATE OR REPLACE FUNCTION public.populate_user_deliverables()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert or update user deliverables for all project members whose role matches the deliverable owner role
  INSERT INTO public.user_deliverables (
    user_id,
    project_id,
    deliverable_name,
    role,
    estimated_effort_remaining,
    due_date
  )
  SELECT 
    pm.user_id,
    NEW.project_id,
    NEW.deliverable_name,
    NEW.owner_role,
    NEW.effort_hours,
    NEW.due_date
  FROM public.project_members pm
  WHERE pm.project_id = NEW.project_id
    AND pm.role::text = NEW.owner_role
  ON CONFLICT (user_id, project_id, deliverable_name) 
  DO UPDATE SET
    role = EXCLUDED.role,
    estimated_effort_remaining = EXCLUDED.estimated_effort_remaining,
    due_date = EXCLUDED.due_date,
    updated_at = now();
  
  RETURN NEW;
END;
$function$;