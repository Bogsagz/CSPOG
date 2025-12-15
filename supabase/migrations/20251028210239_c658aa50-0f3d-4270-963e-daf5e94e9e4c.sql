-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can only see and update their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add user_id column to projects table
ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update projects RLS policies to be user-specific
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON public.projects;

CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- Update table_items RLS policies (access via project ownership)
DROP POLICY IF EXISTS "Anyone can view table items" ON public.table_items;
DROP POLICY IF EXISTS "Anyone can create table items" ON public.table_items;
DROP POLICY IF EXISTS "Anyone can update table items" ON public.table_items;
DROP POLICY IF EXISTS "Anyone can delete table items" ON public.table_items;

CREATE POLICY "Users can view their project table items"
ON public.table_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = table_items.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create table items in their projects"
ON public.table_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = table_items.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their project table items"
ON public.table_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = table_items.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their project table items"
ON public.table_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = table_items.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Update saved_threats RLS policies
DROP POLICY IF EXISTS "Anyone can view saved threats" ON public.saved_threats;
DROP POLICY IF EXISTS "Anyone can create saved threats" ON public.saved_threats;
DROP POLICY IF EXISTS "Anyone can delete saved threats" ON public.saved_threats;

CREATE POLICY "Users can view their project saved threats"
ON public.saved_threats
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = saved_threats.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create saved threats in their projects"
ON public.saved_threats
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = saved_threats.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their project saved threats"
ON public.saved_threats
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = saved_threats.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Update risk_appetite RLS policies
DROP POLICY IF EXISTS "Anyone can view risk appetite" ON public.risk_appetite;
DROP POLICY IF EXISTS "Anyone can create risk appetite" ON public.risk_appetite;
DROP POLICY IF EXISTS "Anyone can update risk appetite" ON public.risk_appetite;
DROP POLICY IF EXISTS "Anyone can delete risk appetite" ON public.risk_appetite;

CREATE POLICY "Users can view their project risk appetite"
ON public.risk_appetite
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = risk_appetite.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create risk appetite in their projects"
ON public.risk_appetite
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = risk_appetite.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their project risk appetite"
ON public.risk_appetite
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = risk_appetite.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their project risk appetite"
ON public.risk_appetite
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = risk_appetite.project_id
    AND projects.user_id = auth.uid()
  )
);