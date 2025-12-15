-- Create enum for project roles
CREATE TYPE public.project_role AS ENUM (
  'risk_owner',
  'security_admin',
  'security_architect',
  'risk_manager',
  'soc',
  'project_delivery'
);

-- Create project_members table to track team members and their roles
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.project_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Users can view project members for projects they belong to
CREATE POLICY "Users can view members of their projects"
ON public.project_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Only risk owners can manage team members
CREATE POLICY "Risk owners can manage team members"
ON public.project_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role = 'risk_owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role = 'risk_owner'
  )
);

-- Create security definer functions to check permissions
CREATE OR REPLACE FUNCTION public.user_has_project_access(
  _user_id UUID,
  _project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_project_role(
  _user_id UUID,
  _project_id UUID
)
RETURNS project_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.project_members
  WHERE user_id = _user_id
  AND project_id = _project_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_can_write_threats(
  _user_id UUID,
  _project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
    AND role IN ('risk_owner', 'security_admin', 'security_architect', 'soc')
  )
$$;

CREATE OR REPLACE FUNCTION public.user_can_write_risk_appetite(
  _user_id UUID,
  _project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
    AND role IN ('risk_owner', 'security_admin', 'risk_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.user_can_write_tables(
  _user_id UUID,
  _project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
    AND project_id = _project_id
    AND role IN ('risk_owner', 'security_admin', 'security_architect')
  )
$$;

-- Update projects RLS policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Users can view projects they're members of"
ON public.projects
FOR SELECT
USING (public.user_has_project_access(auth.uid(), id));

CREATE POLICY "Users can create projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Risk owners can update projects"
ON public.projects
FOR UPDATE
USING (public.user_project_role(auth.uid(), id) = 'risk_owner');

CREATE POLICY "Risk owners can delete projects"
ON public.projects
FOR DELETE
USING (public.user_project_role(auth.uid(), id) = 'risk_owner');

-- Update table_items RLS policies
DROP POLICY IF EXISTS "Users can view their project table items" ON public.table_items;
DROP POLICY IF EXISTS "Users can create table items in their projects" ON public.table_items;
DROP POLICY IF EXISTS "Users can update their project table items" ON public.table_items;
DROP POLICY IF EXISTS "Users can delete their project table items" ON public.table_items;

CREATE POLICY "Members can view project table items"
ON public.table_items
FOR SELECT
USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create table items"
ON public.table_items
FOR INSERT
WITH CHECK (public.user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update table items"
ON public.table_items
FOR UPDATE
USING (public.user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete table items"
ON public.table_items
FOR DELETE
USING (public.user_can_write_tables(auth.uid(), project_id));

-- Update saved_threats RLS policies
DROP POLICY IF EXISTS "Users can view their project saved threats" ON public.saved_threats;
DROP POLICY IF EXISTS "Users can create saved threats in their projects" ON public.saved_threats;
DROP POLICY IF EXISTS "Users can delete their project saved threats" ON public.saved_threats;

CREATE POLICY "Members can view project saved threats"
ON public.saved_threats
FOR SELECT
USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create saved threats"
ON public.saved_threats
FOR INSERT
WITH CHECK (public.user_can_write_threats(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete saved threats"
ON public.saved_threats
FOR DELETE
USING (public.user_can_write_threats(auth.uid(), project_id));

-- Update risk_appetite RLS policies
DROP POLICY IF EXISTS "Users can view their project risk appetite" ON public.risk_appetite;
DROP POLICY IF EXISTS "Users can create risk appetite in their projects" ON public.risk_appetite;
DROP POLICY IF EXISTS "Users can update their project risk appetite" ON public.risk_appetite;
DROP POLICY IF EXISTS "Users can delete their project risk appetite" ON public.risk_appetite;

CREATE POLICY "Members can view project risk appetite"
ON public.risk_appetite
FOR SELECT
USING (public.user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create risk appetite"
ON public.risk_appetite
FOR INSERT
WITH CHECK (public.user_can_write_risk_appetite(auth.uid(), project_id));

CREATE POLICY "Authorized members can update risk appetite"
ON public.risk_appetite
FOR UPDATE
USING (public.user_can_write_risk_appetite(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete risk appetite"
ON public.risk_appetite
FOR DELETE
USING (public.user_can_write_risk_appetite(auth.uid(), project_id));

-- Create trigger to automatically add creator as risk owner
CREATE OR REPLACE FUNCTION public.add_creator_as_risk_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'risk_owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_creator_as_risk_owner();