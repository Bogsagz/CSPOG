-- Add justification fields for likelihood and impact adjustments
ALTER TABLE public.saved_risks
ADD COLUMN likelihood_justification TEXT,
ADD COLUMN impact_justification TEXT;