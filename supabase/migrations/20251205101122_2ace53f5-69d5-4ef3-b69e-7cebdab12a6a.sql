-- Create junction table for user workstream assignments (for delivery and mentor roles)
CREATE TABLE public.user_workstream_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workstream public.workstream NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, workstream)
);

-- Enable RLS
ALTER TABLE public.user_workstream_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Security admins can view all assignments"
  ON public.user_workstream_assignments
  FOR SELECT
  USING (user_is_security_admin());

CREATE POLICY "Security admins can manage assignments"
  ON public.user_workstream_assignments
  FOR ALL
  USING (user_is_security_admin());

CREATE POLICY "Users can view their own assignments"
  ON public.user_workstream_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Migrate existing workstream assignments for delivery and mentor users
INSERT INTO public.user_workstream_assignments (user_id, workstream)
SELECT p.id, p.workstream
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.workstream IS NOT NULL
  AND ur.role IN ('security_delivery', 'security_mentor');

-- Create helper function to check if user has workstream access via assignments
CREATE OR REPLACE FUNCTION public.user_has_workstream_assignment(_user_id uuid, _workstream workstream)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_workstream_assignments
    WHERE user_id = _user_id
      AND workstream = _workstream
  )
$$;