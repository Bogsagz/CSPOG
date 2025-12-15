-- Create requirements table
CREATE TABLE public.requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  priority TEXT,
  status TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for requirements
CREATE POLICY "Users can view requirements for their projects"
ON public.requirements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = requirements.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create requirements for their projects"
ON public.requirements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = requirements.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update requirements for their projects"
ON public.requirements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = requirements.project_id
    AND project_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete requirements for their projects"
ON public.requirements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = requirements.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_requirements_updated_at
BEFORE UPDATE ON public.requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();