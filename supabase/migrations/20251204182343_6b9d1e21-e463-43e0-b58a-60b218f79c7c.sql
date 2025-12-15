-- Create a table to store system diagram layouts
CREATE TABLE public.system_diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable Row Level Security
ALTER TABLE public.system_diagrams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Members can view project diagrams" 
ON public.system_diagrams 
FOR SELECT 
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create diagrams" 
ON public.system_diagrams 
FOR INSERT 
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update diagrams" 
ON public.system_diagrams 
FOR UPDATE 
USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete diagrams" 
ON public.system_diagrams 
FOR DELETE 
USING (user_can_write_tables(auth.uid(), project_id));

-- Add trigger for updated_at
CREATE TRIGGER update_system_diagrams_updated_at
BEFORE UPDATE ON public.system_diagrams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();