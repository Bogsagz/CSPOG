-- Create table for project assessment documentation
CREATE TABLE public.project_assessment_documentation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL UNIQUE,
  bia_completed boolean,
  bia_link text,
  gov_assure_profile text,
  dpia_created boolean,
  dpia_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_assessment_documentation ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view project assessment documentation"
ON public.project_assessment_documentation
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create assessment documentation"
ON public.project_assessment_documentation
FOR INSERT
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update assessment documentation"
ON public.project_assessment_documentation
FOR UPDATE
USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete assessment documentation"
ON public.project_assessment_documentation
FOR DELETE
USING (user_can_write_tables(auth.uid(), project_id));

-- Add trigger for updated_at
CREATE TRIGGER update_project_assessment_documentation_updated_at
BEFORE UPDATE ON public.project_assessment_documentation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();