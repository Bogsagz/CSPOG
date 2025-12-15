-- Create table for CAF assessment responses
CREATE TABLE IF NOT EXISTS public.caf_assessment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  outcome_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  response BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, question_id)
);

-- Enable RLS
ALTER TABLE public.caf_assessment_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view assessment responses for projects they have access to"
ON public.caf_assessment_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_assessment_responses.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert assessment responses for projects they have access to"
ON public.caf_assessment_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_assessment_responses.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update assessment responses for projects they have access to"
ON public.caf_assessment_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_assessment_responses.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete assessment responses for projects they have access to"
ON public.caf_assessment_responses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_assessment_responses.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_caf_assessment_responses_project_outcome ON public.caf_assessment_responses(project_id, outcome_id);