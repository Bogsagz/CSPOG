-- Create function to remove user deliverables when member is removed from project
CREATE OR REPLACE FUNCTION public.remove_user_deliverables_on_member_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Delete all deliverables for this user on this project
  DELETE FROM public.user_deliverables
  WHERE user_id = OLD.user_id
    AND project_id = OLD.project_id;
  
  RETURN OLD;
END;
$function$;

-- Create trigger to automatically remove user deliverables when a member is removed
CREATE TRIGGER remove_user_deliverables_on_member_delete
  AFTER DELETE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.remove_user_deliverables_on_member_removal();