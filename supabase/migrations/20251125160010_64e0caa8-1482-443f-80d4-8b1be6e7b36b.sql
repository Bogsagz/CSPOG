-- Create requirements repository table
CREATE TABLE IF NOT EXISTS public.requirements_repository (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  category TEXT,
  description TEXT,
  reference_url TEXT
);

-- Enable RLS
ALTER TABLE public.requirements_repository ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can add requirements"
  ON public.requirements_repository
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Everyone can view requirements"
  ON public.requirements_repository
  FOR SELECT
  USING (true);

CREATE POLICY "Security admins can update requirements"
  ON public.requirements_repository
  FOR UPDATE
  USING (user_is_security_admin());

CREATE POLICY "Security admins can delete requirements"
  ON public.requirements_repository
  FOR DELETE
  USING (user_is_security_admin());

-- Create requirement_links table (links repository requirements to project requirements)
CREATE TABLE IF NOT EXISTS public.requirement_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  repository_requirement_id UUID NOT NULL REFERENCES public.requirements_repository(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requirement_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authorized members can link requirements"
  ON public.requirement_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requirements r
      WHERE r.id = requirement_links.requirement_id
      AND user_can_write_tables(auth.uid(), r.project_id)
    )
  );

CREATE POLICY "Authorized members can unlink requirements"
  ON public.requirement_links
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM requirements r
      WHERE r.id = requirement_links.requirement_id
      AND user_can_write_tables(auth.uid(), r.project_id)
    )
  );

CREATE POLICY "Members can view requirement links"
  ON public.requirement_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requirements r
      WHERE r.id = requirement_links.requirement_id
      AND user_has_project_access(auth.uid(), r.project_id)
    )
  );