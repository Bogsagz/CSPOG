-- Add policies to allow security admins to view all time allocations
CREATE POLICY "Security admins can view all allocations"
ON public.project_time_allocation
FOR SELECT
USING (user_is_security_admin());

CREATE POLICY "Security admins can view all allocation history"
ON public.project_time_allocation_history
FOR SELECT
USING (user_is_security_admin());