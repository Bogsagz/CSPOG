-- Add policy to allow users to be added as risk owners for projects they create
CREATE POLICY "Allow creator to be added as risk owner"
  ON public.project_members
  FOR INSERT
  WITH CHECK (
    role = 'risk_owner' AND 
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_members.project_id 
      AND projects.user_id = project_members.user_id
    )
  );