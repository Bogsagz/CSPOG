-- Create table for team leave tracking
CREATE TABLE public.team_leave (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.team_leave ENABLE ROW LEVEL SECURITY;

-- Members can view project leave
CREATE POLICY "Members can view project team leave"
ON public.team_leave
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

-- Authorized members can create leave entries
CREATE POLICY "Authorized members can create team leave"
ON public.team_leave
FOR INSERT
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

-- Authorized members can update leave entries
CREATE POLICY "Authorized members can update team leave"
ON public.team_leave
FOR UPDATE
USING (user_can_write_tables(auth.uid(), project_id));

-- Authorized members can delete leave entries
CREATE POLICY "Authorized members can delete team leave"
ON public.team_leave
FOR DELETE
USING (user_can_write_tables(auth.uid(), project_id));

-- Create index for faster queries
CREATE INDEX idx_team_leave_project_id ON public.team_leave(project_id);
CREATE INDEX idx_team_leave_dates ON public.team_leave(start_date, end_date);