-- Add new lifecycle date columns to projects table
ALTER TABLE public.projects
ADD COLUMN end_live date,
ADD COLUMN start_disposal date,
ADD COLUMN complete_disposal date;