-- Add policy to allow users to delete their own absences
CREATE POLICY "Users can delete their own absences"
ON public.team_leave
FOR DELETE
USING (auth.uid() = user_id);