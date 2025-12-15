-- Add public_holiday to absence types in app_settings
UPDATE public.app_settings 
SET setting_value = '["leave", "sickness", "other", "working_elsewhere", "public_holiday"]'::jsonb
WHERE setting_key = 'absence_types';

-- Make project_id nullable in team_leave to allow org-wide absences
ALTER TABLE public.team_leave 
ALTER COLUMN project_id DROP NOT NULL;

-- Add index for efficient querying of public holidays
CREATE INDEX IF NOT EXISTS idx_team_leave_absence_type 
ON public.team_leave(absence_type, start_date);

-- Add unique constraint to prevent duplicate public holiday entries per user per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_leave_unique_public_holiday
ON public.team_leave(user_id, start_date, absence_type)
WHERE absence_type = 'public_holiday';