-- Drop the existing policy that allows users to delete their own absences
DROP POLICY IF EXISTS "Users can delete their own absences" ON public.team_leave;

-- Create new policy: Users can only delete their own FUTURE absences
CREATE POLICY "Users can delete their own future absences"
ON public.team_leave
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND start_date >= CURRENT_DATE
);

-- Create new policy: Security admins can delete any absence
CREATE POLICY "Security admins can delete any team leave"
ON public.team_leave
FOR DELETE
TO authenticated
USING (user_is_security_admin());