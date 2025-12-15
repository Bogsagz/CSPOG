-- Create enum for issue types
CREATE TYPE public.issue_type AS ENUM ('vulnerability', 'weakness', 'other');

-- Create issues table
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  issue_number TEXT NOT NULL,
  name TEXT NOT NULL,
  type issue_type NOT NULL,
  description TEXT,
  date_first_occurred DATE,
  resolution_plan TEXT,
  date_resolved DATE,
  linked_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  cve_score TEXT,
  epss_score TEXT,
  patch_available BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, issue_number)
);

-- Enable Row Level Security
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create policies for issue access
CREATE POLICY "Members can view project issues"
ON public.issues
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create issues"
ON public.issues
FOR INSERT
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update issues"
ON public.issues
FOR UPDATE
USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete issues"
ON public.issues
FOR DELETE
USING (user_can_write_tables(auth.uid(), project_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate next issue number for a project
CREATE OR REPLACE FUNCTION public.generate_issue_number(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  issue_number TEXT;
BEGIN
  -- Get the highest issue number for this project
  SELECT COALESCE(MAX(CAST(SUBSTRING(issue_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.issues
  WHERE project_id = p_project_id;
  
  -- Format as ISS-001, ISS-002, etc.
  issue_number := 'ISS-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN issue_number;
END;
$$;