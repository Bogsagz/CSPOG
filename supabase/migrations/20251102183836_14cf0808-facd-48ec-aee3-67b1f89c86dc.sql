-- Add remediation_plan column to saved_risks table
ALTER TABLE public.saved_risks 
ADD COLUMN remediation_plan TEXT;