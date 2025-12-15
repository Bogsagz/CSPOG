-- Create table for project time allocation
CREATE TABLE IF NOT EXISTS public.project_time_allocation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  allocation_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_project UNIQUE(user_id, project_id),
  CONSTRAINT valid_percentage CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
);

-- Enable RLS
ALTER TABLE public.project_time_allocation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own allocations"
  ON public.project_time_allocation FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocations"
  ON public.project_time_allocation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocations"
  ON public.project_time_allocation FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allocations"
  ON public.project_time_allocation FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_project_time_allocation_updated_at
  BEFORE UPDATE ON public.project_time_allocation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();