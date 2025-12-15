-- Create table to store question-evidence relationships
CREATE TABLE public.caf_question_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  outcome_id TEXT NOT NULL,
  evidence_item TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, question_id, evidence_item)
);

-- Enable RLS
ALTER TABLE public.caf_question_evidence ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view question evidence for their projects"
  ON public.caf_question_evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_question_evidence.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert question evidence for their projects"
  ON public.caf_question_evidence
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_question_evidence.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update question evidence for their projects"
  ON public.caf_question_evidence
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_question_evidence.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete question evidence for their projects"
  ON public.caf_question_evidence
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = caf_question_evidence.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_caf_question_evidence_project_question 
  ON public.caf_question_evidence(project_id, question_id);