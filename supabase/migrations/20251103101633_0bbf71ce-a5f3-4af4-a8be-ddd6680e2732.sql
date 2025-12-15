-- Create table for project security scope
CREATE TABLE public.project_security_scope (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL UNIQUE,
  uses_third_party_providers boolean,
  uses_intellectual_property boolean,
  requires_data_sharing boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_security_scope ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view project security scope"
ON public.project_security_scope
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create security scope"
ON public.project_security_scope
FOR INSERT
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update security scope"
ON public.project_security_scope
FOR UPDATE
USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete security scope"
ON public.project_security_scope
FOR DELETE
USING (user_can_write_tables(auth.uid(), project_id));

-- Add trigger for updated_at
CREATE TRIGGER update_project_security_scope_updated_at
BEFORE UPDATE ON public.project_security_scope
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();