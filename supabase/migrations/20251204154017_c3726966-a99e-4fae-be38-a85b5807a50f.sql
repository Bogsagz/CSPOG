-- Drop and recreate function with risk_manager added
DROP FUNCTION IF EXISTS public.user_can_write_threats(uuid, uuid) CASCADE;

CREATE FUNCTION public.user_can_write_threats(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = _project_id
      AND user_id = _user_id
      AND role IN ('delivery', 'security_architect', 'risk_manager', 'sec_mon', 'sec_eng')
  )
$$;

-- Recreate RLS policies for saved_threats
CREATE POLICY "Authorized members can create saved threats" 
ON public.saved_threats 
FOR INSERT 
WITH CHECK (user_can_write_threats(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete saved threats" 
ON public.saved_threats 
FOR DELETE 
USING (user_can_write_threats(auth.uid(), project_id));

CREATE POLICY "Authorized members can update saved threats" 
ON public.saved_threats 
FOR UPDATE 
USING (user_can_write_threats(auth.uid(), project_id))
WITH CHECK (user_can_write_threats(auth.uid(), project_id));

-- Recreate RLS policies for saved_risks
CREATE POLICY "Authorized members can create saved risks" 
ON public.saved_risks 
FOR INSERT 
WITH CHECK (user_can_write_threats(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete saved risks" 
ON public.saved_risks 
FOR DELETE 
USING (user_can_write_threats(auth.uid(), project_id));

CREATE POLICY "Authorized members can update saved risks" 
ON public.saved_risks 
FOR UPDATE 
USING (user_can_write_threats(auth.uid(), project_id));

-- Recreate RLS policies for threat_controls
CREATE POLICY "Authorized members can create threat controls" 
ON public.threat_controls 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM saved_threats 
  WHERE saved_threats.id = threat_controls.threat_id 
  AND user_can_write_threats(auth.uid(), saved_threats.project_id)
));

CREATE POLICY "Authorized members can delete threat controls" 
ON public.threat_controls 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM saved_threats 
  WHERE saved_threats.id = threat_controls.threat_id 
  AND user_can_write_threats(auth.uid(), saved_threats.project_id)
));

-- Recreate RLS policies for risk_controls
CREATE POLICY "Authorized members can create risk controls" 
ON public.risk_controls 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM saved_risks 
  WHERE saved_risks.id = risk_controls.risk_id 
  AND user_can_write_threats(auth.uid(), saved_risks.project_id)
));

CREATE POLICY "Authorized members can delete risk controls" 
ON public.risk_controls 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM saved_risks 
  WHERE saved_risks.id = risk_controls.risk_id 
  AND user_can_write_threats(auth.uid(), saved_risks.project_id)
));

-- Recreate RLS policies for risk_issues
CREATE POLICY "Authorized members can create risk issues" 
ON public.risk_issues 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM saved_risks 
  WHERE saved_risks.id = risk_issues.risk_id 
  AND user_can_write_threats(auth.uid(), saved_risks.project_id)
));

CREATE POLICY "Authorized members can delete risk issues" 
ON public.risk_issues 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM saved_risks 
  WHERE saved_risks.id = risk_issues.risk_id 
  AND user_can_write_threats(auth.uid(), saved_risks.project_id)
));