-- Add required column to project_deliverable_assignments
ALTER TABLE public.project_deliverable_assignments 
ADD COLUMN required boolean NOT NULL DEFAULT true;