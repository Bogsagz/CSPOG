-- Add unique constraint to prevent duplicate project titles per user
ALTER TABLE public.projects 
ADD CONSTRAINT projects_title_user_id_key UNIQUE (title, user_id);

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT projects_title_user_id_key ON public.projects IS 
'Ensures each user can only create one project with a given title. Prevents duplicate project names per user.';