-- Create junction table for risk-control relationships
CREATE TABLE public.risk_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.saved_risks(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES public.security_controls(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(risk_id, control_id)
);

-- Create junction table for risk-issue relationships
CREATE TABLE public.risk_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.saved_risks(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(risk_id, issue_id)
);

-- Enable RLS
ALTER TABLE public.risk_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_issues ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk_controls
CREATE POLICY "Members can view risk controls"
  ON public.risk_controls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_risks
      WHERE saved_risks.id = risk_controls.risk_id
      AND user_has_project_access(auth.uid(), saved_risks.project_id)
    )
  );

CREATE POLICY "Authorized members can create risk controls"
  ON public.risk_controls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.saved_risks
      WHERE saved_risks.id = risk_controls.risk_id
      AND user_can_write_threats(auth.uid(), saved_risks.project_id)
    )
  );

CREATE POLICY "Authorized members can delete risk controls"
  ON public.risk_controls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_risks
      WHERE saved_risks.id = risk_controls.risk_id
      AND user_can_write_threats(auth.uid(), saved_risks.project_id)
    )
  );

-- RLS policies for risk_issues
CREATE POLICY "Members can view risk issues"
  ON public.risk_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_risks
      WHERE saved_risks.id = risk_issues.risk_id
      AND user_has_project_access(auth.uid(), saved_risks.project_id)
    )
  );

CREATE POLICY "Authorized members can create risk issues"
  ON public.risk_issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.saved_risks
      WHERE saved_risks.id = risk_issues.risk_id
      AND user_can_write_threats(auth.uid(), saved_risks.project_id)
    )
  );

CREATE POLICY "Authorized members can delete risk issues"
  ON public.risk_issues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_risks
      WHERE saved_risks.id = risk_issues.risk_id
      AND user_can_write_threats(auth.uid(), saved_risks.project_id)
    )
  );