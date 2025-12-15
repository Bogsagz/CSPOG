-- Create obligations table
CREATE TABLE public.obligations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  obligation_type TEXT,
  compliance_framework TEXT,
  status TEXT,
  due_date DATE,
  owner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;

-- Create policies for obligations
CREATE POLICY "Members can view project obligations"
  ON public.obligations
  FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create obligations"
  ON public.obligations
  FOR INSERT
  WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update obligations"
  ON public.obligations
  FOR UPDATE
  USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete obligations"
  ON public.obligations
  FOR DELETE
  USING (user_can_write_tables(auth.uid(), project_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_obligations_updated_at
  BEFORE UPDATE ON public.obligations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();