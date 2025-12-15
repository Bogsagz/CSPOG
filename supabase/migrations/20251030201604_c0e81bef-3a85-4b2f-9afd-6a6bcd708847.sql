-- Add UPDATE policy for saved_threats
CREATE POLICY "Authorized members can update saved threats"
ON public.saved_threats
FOR UPDATE
USING (user_can_write_threats(auth.uid(), project_id))
WITH CHECK (user_can_write_threats(auth.uid(), project_id));