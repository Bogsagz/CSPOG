-- Add parent_threat_id to track threat hierarchy (initial -> intermediate -> final)
ALTER TABLE public.saved_threats
ADD COLUMN parent_threat_id uuid REFERENCES public.saved_threats(id) ON DELETE SET NULL;

-- Create index for efficient hierarchy queries
CREATE INDEX idx_saved_threats_parent ON public.saved_threats(parent_threat_id);