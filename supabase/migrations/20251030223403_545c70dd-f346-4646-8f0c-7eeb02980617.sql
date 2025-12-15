-- Add project start and end discovery date columns to projects table
ALTER TABLE public.projects
ADD COLUMN project_start date,
ADD COLUMN end_discovery date;