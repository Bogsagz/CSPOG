-- Add UPDATE policy for saved_risks
CREATE POLICY "Authorized members can update saved risks"
ON public.saved_risks
FOR UPDATE
USING (user_can_write_threats(auth.uid(), project_id))
WITH CHECK (user_can_write_threats(auth.uid(), project_id));