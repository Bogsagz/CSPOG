-- Create table for project key people
CREATE TABLE public.project_key_people (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  role_type text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  grade text,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, role_type)
);

-- Enable RLS
ALTER TABLE public.project_key_people ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view project key people"
ON public.project_key_people
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create key people"
ON public.project_key_people
FOR INSERT
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update key people"
ON public.project_key_people
FOR UPDATE
USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete key people"
ON public.project_key_people
FOR DELETE
USING (user_can_write_tables(auth.uid(), project_id));

-- Add trigger for updated_at
CREATE TRIGGER update_project_key_people_updated_at
BEFORE UPDATE ON public.project_key_people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();