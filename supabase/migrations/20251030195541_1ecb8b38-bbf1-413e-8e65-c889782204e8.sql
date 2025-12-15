-- Add risk_rating and impact_type columns to saved_risks table
ALTER TABLE public.saved_risks
ADD COLUMN risk_rating text,
ADD COLUMN impact_type text;