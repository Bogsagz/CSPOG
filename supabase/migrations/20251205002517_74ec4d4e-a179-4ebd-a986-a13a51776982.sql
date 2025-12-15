-- Add hours_worked column to track actual time worked during each allocation period
ALTER TABLE public.project_time_allocation_history 
ADD COLUMN IF NOT EXISTS hours_worked numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS period_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS period_end timestamp with time zone;