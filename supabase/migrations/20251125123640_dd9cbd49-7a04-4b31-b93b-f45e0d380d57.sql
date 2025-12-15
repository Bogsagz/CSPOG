-- Create table to store generated CAF outcome narratives
CREATE TABLE public.caf_outcome_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  outcome_id TEXT NOT NULL,
  narrative TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, outcome_id)
);

-- Enable RLS
ALTER TABLE public.caf_outcome_narratives ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view narratives for their projects"
  ON public.caf_outcome_narratives
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_outcome_narratives.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert narratives for their projects"
  ON public.caf_outcome_narratives
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_outcome_narratives.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update narratives for their projects"
  ON public.caf_outcome_narratives
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_outcome_narratives.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete narratives for their projects"
  ON public.caf_outcome_narratives
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_outcome_narratives.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_caf_outcome_narratives_project 
  ON public.caf_outcome_narratives(project_id, outcome_id);