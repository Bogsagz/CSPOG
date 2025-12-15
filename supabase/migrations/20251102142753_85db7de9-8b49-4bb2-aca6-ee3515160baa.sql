-- Enable realtime for workstream overview tables
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.project_deliverable_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.team_leave REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_deliverable_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_leave;