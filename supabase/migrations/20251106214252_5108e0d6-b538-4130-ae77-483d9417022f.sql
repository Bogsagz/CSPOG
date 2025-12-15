-- Create a secured function to return all project ids and titles for authenticated users
CREATE OR REPLACE FUNCTION public.get_project_list()
RETURNS TABLE(id uuid, title text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT id, title
  FROM public.projects
  ORDER BY title;
END;
$$;