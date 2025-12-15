-- Create table for structured log sources linked to detections
CREATE TABLE public.detection_log_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  detection_id UUID NOT NULL REFERENCES public.attack_detections(id) ON DELETE CASCADE,
  data_source TEXT NOT NULL,
  data_component TEXT NOT NULL,
  channel TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(detection_id, data_source, data_component, channel)
);

-- Enable RLS
ALTER TABLE public.detection_log_sources ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (same as attack_detections - everyone can view)
CREATE POLICY "Everyone can view detection log sources"
ON public.detection_log_sources
FOR SELECT
USING (true);

-- Create policy for admin management
CREATE POLICY "Security admins can manage detection log sources"
ON public.detection_log_sources
FOR ALL
USING (user_is_security_admin());