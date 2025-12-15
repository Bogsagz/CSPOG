-- Add absence_type column to team_leave table
ALTER TABLE public.team_leave 
ADD COLUMN absence_type text NOT NULL DEFAULT 'leave';

-- Add constraint to ensure valid absence types
ALTER TABLE public.team_leave 
ADD CONSTRAINT valid_absence_type CHECK (absence_type IN ('leave', 'sickness'));