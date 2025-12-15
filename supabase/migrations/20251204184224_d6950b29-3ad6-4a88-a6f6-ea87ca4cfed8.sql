-- Fix the threat_controls INSERT policy - arguments were in wrong order
DROP POLICY IF EXISTS "Authorized members can create threat controls" ON public.threat_controls;

CREATE POLICY "Authorized members can create threat controls"
ON public.threat_controls
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM saved_threats
    WHERE saved_threats.id = threat_controls.threat_id
      AND user_can_write_threats(saved_threats.project_id, auth.uid())
  )
);

-- Also fix the DELETE policy which likely has the same issue
DROP POLICY IF EXISTS "Authorized members can delete threat controls" ON public.threat_controls;

CREATE POLICY "Authorized members can delete threat controls"
ON public.threat_controls
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM saved_threats
    WHERE saved_threats.id = threat_controls.threat_id
      AND user_can_write_threats(saved_threats.project_id, auth.uid())
  )
);