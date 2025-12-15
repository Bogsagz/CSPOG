-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create security_controls table
CREATE TABLE public.security_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  effectiveness_rating TEXT,
  layer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.security_controls ENABLE ROW LEVEL SECURITY;

-- Create policies for security_controls
CREATE POLICY "Members can view project security controls"
ON public.security_controls
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create security controls"
ON public.security_controls
FOR INSERT
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update security controls"
ON public.security_controls
FOR UPDATE
USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete security controls"
ON public.security_controls
FOR DELETE
USING (user_can_write_tables(auth.uid(), project_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_security_controls_updated_at
BEFORE UPDATE ON public.security_controls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();