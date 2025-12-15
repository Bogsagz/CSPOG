-- Allow users to view their own project memberships across all projects
CREATE POLICY "Users can view their own project memberships"
ON public.project_members
FOR SELECT
USING (auth.uid() = user_id);