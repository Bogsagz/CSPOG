-- Create function to add creator as risk_manager (Information Assurer)
CREATE OR REPLACE FUNCTION public.add_creator_as_risk_manager()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'risk_manager'::project_role);
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign creator as risk_manager when project is created
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_risk_manager();