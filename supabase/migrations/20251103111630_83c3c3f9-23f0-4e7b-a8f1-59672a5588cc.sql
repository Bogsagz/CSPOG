-- Create table to track document versions for each artefact
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  artefact_type TEXT NOT NULL,
  version_number TEXT NOT NULL,
  major_version INTEGER NOT NULL DEFAULT 1,
  minor_version INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, artefact_type, version_number)
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Members can view document versions for their projects
CREATE POLICY "Members can view document versions"
  ON public.document_versions
  FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

-- Members can create document versions for their projects
CREATE POLICY "Members can create document versions"
  ON public.document_versions
  FOR INSERT
  WITH CHECK (user_has_project_access(auth.uid(), project_id));

-- Index for performance
CREATE INDEX idx_document_versions_project_artefact 
  ON public.document_versions(project_id, artefact_type);