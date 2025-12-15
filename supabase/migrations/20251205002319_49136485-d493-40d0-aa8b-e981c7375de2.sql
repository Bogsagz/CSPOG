-- Add fields to track active task and work start time
ALTER TABLE public.user_deliverables 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS started_working_at timestamp with time zone;

-- Ensure only one task can be active per user at a time (handled in app logic)
CREATE INDEX IF NOT EXISTS idx_user_deliverables_active ON public.user_deliverables(user_id, is_active) WHERE is_active = true;