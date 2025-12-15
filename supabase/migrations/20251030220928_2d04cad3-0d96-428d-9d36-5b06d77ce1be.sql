-- Update the constraint to include new absence types
ALTER TABLE public.team_leave 
DROP CONSTRAINT IF EXISTS valid_absence_type;

ALTER TABLE public.team_leave 
ADD CONSTRAINT valid_absence_type CHECK (absence_type IN ('leave', 'sickness', 'other', 'working_elsewhere'));