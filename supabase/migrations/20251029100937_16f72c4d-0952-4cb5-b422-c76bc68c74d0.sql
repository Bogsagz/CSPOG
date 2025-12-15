-- Create table for saved risk statements
CREATE TABLE public.saved_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  risk_statement TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_risks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Members can view project saved risks"
ON public.saved_risks
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create saved risks"
ON public.saved_risks
FOR INSERT
WITH CHECK (user_can_write_threats(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete saved risks"
ON public.saved_risks
FOR DELETE
USING (user_can_write_threats(auth.uid(), project_id));