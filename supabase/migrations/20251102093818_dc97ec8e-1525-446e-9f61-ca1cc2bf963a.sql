-- Create trigger to automatically populate project deliverables when a project is created
CREATE TRIGGER populate_deliverables_on_project_creation
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_project_deliverables();

-- Create function to populate user deliverables when project deliverables are created
CREATE OR REPLACE FUNCTION public.populate_user_deliverables()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert user deliverables for all project members whose role matches the deliverable owner role
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
    AND pm.role::text = NEW.owner_role;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to populate user deliverables when project deliverable assignments are created
CREATE TRIGGER populate_user_deliverables_on_assignment
  AFTER INSERT ON public.project_deliverable_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_user_deliverables();