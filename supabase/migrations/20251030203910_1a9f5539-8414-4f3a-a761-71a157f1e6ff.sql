-- Add threat_id column to saved_risks to link risks to threats
ALTER TABLE public.saved_risks
ADD COLUMN threat_id uuid REFERENCES public.saved_threats(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_saved_risks_threat_id ON public.saved_risks(threat_id);

-- Add comment to document the relationship
COMMENT ON COLUMN public.saved_risks.threat_id IS 'Links risk to the threat it was created from. NULL for non-threat based risks.';