-- Create function and trigger to populate user_deliverables when a project member is added
CREATE OR REPLACE FUNCTION public.populate_user_deliverables_on_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert deliverables for the new member's role on this project, avoid duplicates
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
    AND NOT EXISTS (
      SELECT 1 FROM public.user_deliverables ud
      WHERE ud.user_id = NEW.user_id
        AND ud.project_id = a.project_id
        AND ud.deliverable_name = a.deliverable_name
    );

  RETURN NEW;
END;
$$;

-- Create trigger on project_members insert
DROP TRIGGER IF EXISTS populate_user_deliverables_on_member_insert ON public.project_members;
CREATE TRIGGER populate_user_deliverables_on_member_insert
AFTER INSERT ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.populate_user_deliverables_on_member();