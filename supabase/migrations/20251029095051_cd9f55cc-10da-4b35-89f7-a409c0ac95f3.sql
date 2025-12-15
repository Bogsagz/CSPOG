-- Add secure by design required field to projects
ALTER TABLE public.projects 
ADD COLUMN secure_by_design_required boolean DEFAULT false NOT NULL;