-- Fix the saved_risks INSERT policy - arguments were in wrong order
DROP POLICY IF EXISTS "Authorized members can create saved risks" ON public.saved_risks;

CREATE POLICY "Authorized members can create saved risks"
ON public.saved_risks
FOR INSERT
WITH CHECK (user_can_write_threats(project_id, auth.uid()));