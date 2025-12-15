-- Add log_sources to attack_detections
ALTER TABLE public.attack_detections
ADD COLUMN log_sources text[];

-- Add reference_url to attack_mitigations for hyperlinks
ALTER TABLE public.attack_mitigations
ADD COLUMN reference_url text;