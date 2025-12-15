-- Add stage column to saved_threats table to differentiate between initial, intermediate, and final threats
ALTER TABLE public.saved_threats 
ADD COLUMN stage TEXT NOT NULL DEFAULT 'initial';

-- Create an index for efficient filtering by stage
CREATE INDEX idx_saved_threats_stage ON public.saved_threats(project_id, stage);