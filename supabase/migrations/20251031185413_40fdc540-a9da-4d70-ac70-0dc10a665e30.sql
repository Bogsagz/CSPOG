-- Drop existing policy and create a simpler one for testing
DROP POLICY IF EXISTS "Users and security admins can create projects" ON public.projects;

-- Create simpler policy that allows any authenticated user to insert their own projects
CREATE POLICY "Authenticated users can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);