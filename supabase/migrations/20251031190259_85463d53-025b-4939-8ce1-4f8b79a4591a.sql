-- Re-enable RLS on both tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies on project_members
DROP POLICY IF EXISTS "Security admins can insert project members" ON public.project_members;

-- Create comprehensive INSERT policy for project_members
CREATE POLICY "Project members can be added"
  ON public.project_members
  FOR INSERT
  WITH CHECK (
    -- Security admins can add anyone
    user_is_security_admin() 
    OR 
    -- Project risk owners can add team members
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'risk_owner'
    )
  );