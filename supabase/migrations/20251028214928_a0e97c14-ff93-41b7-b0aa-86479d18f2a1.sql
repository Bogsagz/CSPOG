-- Drop policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view members of their projects" ON public.project_members;
DROP POLICY IF EXISTS "Risk owners can manage team members" ON public.project_members;

-- The "Users can view their own project memberships" policy is safe and will remain
-- Risk owner permissions will be enforced through security definer functions in the application layer