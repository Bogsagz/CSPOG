-- Remove issue_number column from issues table
ALTER TABLE public.issues 
DROP COLUMN IF EXISTS issue_number;