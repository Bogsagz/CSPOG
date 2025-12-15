-- Create table for project deliverable assignments
CREATE TABLE IF NOT EXISTS public.project_deliverable_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  deliverable_name TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  effort_hours NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, deliverable_name)
);

-- Enable RLS
ALTER TABLE public.project_deliverable_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Members can view project deliverable assignments"
  ON public.project_deliverable_assignments
  FOR SELECT
  USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create deliverable assignments"
  ON public.project_deliverable_assignments
  FOR INSERT
  WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update deliverable assignments"
  ON public.project_deliverable_assignments
  FOR UPDATE
  USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete deliverable assignments"
  ON public.project_deliverable_assignments
  FOR DELETE
  USING (user_can_write_tables(auth.uid(), project_id));

-- Add trigger for updated_at
CREATE TRIGGER update_project_deliverable_assignments_updated_at
  BEFORE UPDATE ON public.project_deliverable_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();