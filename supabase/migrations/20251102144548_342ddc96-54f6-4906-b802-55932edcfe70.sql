-- Update function to only remove incomplete deliverables when member is removed
CREATE OR REPLACE FUNCTION public.remove_user_deliverables_on_member_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only delete incomplete deliverables; keep completed ones for project timeline history
  DELETE FROM public.user_deliverables
  WHERE user_id = OLD.user_id
    AND project_id = OLD.project_id
    AND is_completed = false;
  
  RETURN OLD;
END;
$function$;

-- Update function to only populate incomplete deliverables for new members
CREATE OR REPLACE FUNCTION public.populate_user_deliverables_on_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert only incomplete deliverables for the new member's role on this project
  INSERT INTO public.user_deliverables (
    user_id,
    project_id,
    deliverable_name,
    role,
    estimated_effort_remaining,
    due_date
  )
  SELECT 
    NEW.user_id,
    a.project_id,
    a.deliverable_name,
    NEW.role::text,
    a.effort_hours,
    a.due_date
  FROM public.project_deliverable_assignments a
  WHERE a.project_id = NEW.project_id
    AND a.owner_role = NEW.role::text
    AND a.is_completed = false  -- Only assign incomplete deliverables
    AND NOT EXISTS (
      SELECT 1 FROM public.user_deliverables ud
      WHERE ud.user_id = NEW.user_id
        AND ud.project_id = a.project_id
        AND ud.deliverable_name = a.deliverable_name
    );

  RETURN NEW;
END;
$function$;