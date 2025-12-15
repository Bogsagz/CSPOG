-- Create table for tracking user deliverables
CREATE TABLE public.user_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  deliverable_name TEXT NOT NULL,
  role TEXT NOT NULL,
  estimated_effort_remaining DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id, deliverable_name)
);

-- Enable RLS
ALTER TABLE public.user_deliverables ENABLE ROW LEVEL SECURITY;

-- Users can view their own deliverables
CREATE POLICY "Users can view their own deliverables"
ON public.user_deliverables
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own deliverables
CREATE POLICY "Users can create their own deliverables"
ON public.user_deliverables
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own deliverables
CREATE POLICY "Users can update their own deliverables"
ON public.user_deliverables
FOR UPDATE
USING (auth.uid() = user_id);

-- Project members can view deliverables
CREATE POLICY "Project members can view deliverables"
ON public.user_deliverables
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

-- Trigger for updated_at
CREATE TRIGGER update_user_deliverables_updated_at
BEFORE UPDATE ON public.user_deliverables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();