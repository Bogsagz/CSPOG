-- Add policy to allow users to see projects they created
CREATE POLICY "Users can view projects they created"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);