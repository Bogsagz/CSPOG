-- Create table for tracking historical time allocation changes
CREATE TABLE IF NOT EXISTS public.project_time_allocation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  allocation_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_percentage_history CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100)
);

-- Enable RLS
ALTER TABLE public.project_time_allocation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for history table
CREATE POLICY "Users can view their own allocation history"
  ON public.project_time_allocation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocation history"
  ON public.project_time_allocation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient historical queries
CREATE INDEX idx_allocation_history_user_date 
  ON public.project_time_allocation_history(user_id, created_at DESC);

CREATE INDEX idx_allocation_history_project_date 
  ON public.project_time_allocation_history(project_id, created_at DESC);

-- Create trigger function to automatically log changes to history
CREATE OR REPLACE FUNCTION public.log_time_allocation_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a record into history table whenever allocation changes
  INSERT INTO public.project_time_allocation_history (
    user_id, 
    project_id, 
    allocation_percentage
  )
  VALUES (
    NEW.user_id,
    NEW.project_id,
    NEW.allocation_percentage
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers for INSERT and UPDATE on project_time_allocation
CREATE TRIGGER log_allocation_insert
  AFTER INSERT ON public.project_time_allocation
  FOR EACH ROW
  EXECUTE FUNCTION public.log_time_allocation_change();

CREATE TRIGGER log_allocation_update
  AFTER UPDATE ON public.project_time_allocation
  FOR EACH ROW
  WHEN (OLD.allocation_percentage IS DISTINCT FROM NEW.allocation_percentage)
  EXECUTE FUNCTION public.log_time_allocation_change();