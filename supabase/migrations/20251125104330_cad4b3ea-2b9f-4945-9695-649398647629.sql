-- Create table for CAF evidence selections
CREATE TABLE IF NOT EXISTS public.caf_evidence_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  outcome_id TEXT NOT NULL,
  evidence_item TEXT NOT NULL,
  selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, outcome_id, evidence_item)
);

-- Enable RLS
ALTER TABLE public.caf_evidence_selections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view evidence selections for their projects"
ON public.caf_evidence_selections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_evidence_selections.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert evidence selections for their projects"
ON public.caf_evidence_selections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_evidence_selections.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update evidence selections for their projects"
ON public.caf_evidence_selections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_evidence_selections.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete evidence selections for their projects"
ON public.caf_evidence_selections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = caf_evidence_selections.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_caf_evidence_selections_updated_at
BEFORE UPDATE ON public.caf_evidence_selections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();