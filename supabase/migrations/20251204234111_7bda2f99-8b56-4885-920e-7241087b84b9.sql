-- Create table to store selected log sources for threats
CREATE TABLE public.threat_log_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threat_id UUID NOT NULL REFERENCES public.saved_threats(id) ON DELETE CASCADE,
  log_source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(threat_id, log_source)
);

-- Enable RLS
ALTER TABLE public.threat_log_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Members can view threat log sources"
ON public.threat_log_sources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM saved_threats st
    WHERE st.id = threat_log_sources.threat_id
    AND user_has_project_access(auth.uid(), st.project_id)
  )
);

CREATE POLICY "Authorized members can create threat log sources"
ON public.threat_log_sources
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM saved_threats st
    WHERE st.id = threat_log_sources.threat_id
    AND user_can_write_threats(st.project_id, auth.uid())
  )
);

CREATE POLICY "Authorized members can delete threat log sources"
ON public.threat_log_sources
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM saved_threats st
    WHERE st.id = threat_log_sources.threat_id
    AND user_can_write_threats(st.project_id, auth.uid())
  )
);