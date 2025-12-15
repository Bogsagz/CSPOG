-- Fix saved_threats INSERT policy - arguments in wrong order
DROP POLICY IF EXISTS "Authorized members can create saved threats" ON public.saved_threats;

CREATE POLICY "Authorized members can create saved threats"
ON public.saved_threats
FOR INSERT
WITH CHECK (user_can_write_threats(project_id, auth.uid()));

-- Fix saved_threats UPDATE policy
DROP POLICY IF EXISTS "Authorized members can update saved threats" ON public.saved_threats;

CREATE POLICY "Authorized members can update saved threats"
ON public.saved_threats
FOR UPDATE
USING (user_can_write_threats(project_id, auth.uid()))
WITH CHECK (user_can_write_threats(project_id, auth.uid()));

-- Fix saved_threats DELETE policy
DROP POLICY IF EXISTS "Authorized members can delete saved threats" ON public.saved_threats;

CREATE POLICY "Authorized members can delete saved threats"
ON public.saved_threats
FOR DELETE
USING (user_can_write_threats(project_id, auth.uid()));