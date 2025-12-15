-- Add anticipated go live date to projects
ALTER TABLE public.projects 
ADD COLUMN anticipated_go_live date NULL;