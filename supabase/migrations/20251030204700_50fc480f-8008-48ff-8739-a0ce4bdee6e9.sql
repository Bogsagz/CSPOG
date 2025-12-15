-- Create junction table to link threats and controls
CREATE TABLE public.threat_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_id uuid NOT NULL REFERENCES public.saved_threats(id) ON DELETE CASCADE,
  control_id uuid NOT NULL REFERENCES public.security_controls(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(threat_id, control_id)
);

-- Enable RLS
ALTER TABLE public.threat_controls ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Members can view threat controls"
ON public.threat_controls
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.saved_threats
    WHERE saved_threats.id = threat_controls.threat_id
    AND user_has_project_access(auth.uid(), saved_threats.project_id)
  )
);

CREATE POLICY "Authorized members can create threat controls"
ON public.threat_controls
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.saved_threats
    WHERE saved_threats.id = threat_controls.threat_id
    AND user_can_write_threats(auth.uid(), saved_threats.project_id)
  )
);

CREATE POLICY "Authorized members can delete threat controls"
ON public.threat_controls
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.saved_threats
    WHERE saved_threats.id = threat_controls.threat_id
    AND user_can_write_threats(auth.uid(), saved_threats.project_id)
  )
);

-- Add indexes for performance
CREATE INDEX idx_threat_controls_threat_id ON public.threat_controls(threat_id);
CREATE INDEX idx_threat_controls_control_id ON public.threat_controls(control_id);