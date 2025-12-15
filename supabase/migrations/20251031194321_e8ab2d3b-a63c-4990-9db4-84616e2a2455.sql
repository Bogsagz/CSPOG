-- Create a function to auto-populate deliverables for new projects
CREATE OR REPLACE FUNCTION public.populate_project_deliverables()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  timeline_activities jsonb;
  activity jsonb;
  activity_name text;
  info_assurer_days numeric;
  security_architect_days numeric;
  soc_analyst_days numeric;
  is_milestone boolean;
BEGIN
  -- Get timeline activities from app_settings
  SELECT setting_value INTO timeline_activities
  FROM public.app_settings
  WHERE setting_key = 'timeline_activities';

  -- If no timeline activities found or project has no start date, skip
  IF timeline_activities IS NULL OR NEW.project_start IS NULL THEN
    RETURN NEW;
  END IF;

  -- Loop through each activity and create deliverable assignments
  FOR activity IN SELECT * FROM jsonb_array_elements(timeline_activities)
  LOOP
    activity_name := activity->>'name';
    info_assurer_days := (activity->>'infoAssurerDays')::numeric;
    security_architect_days := (activity->>'securityArchitectDays')::numeric;
    soc_analyst_days := (activity->>'socAnalystDays')::numeric;
    is_milestone := COALESCE((activity->>'isMilestone')::boolean, false);

    -- Only create deliverables for non-milestone activities
    IF NOT is_milestone THEN
      -- Determine the primary owner based on who has the most effort
      DECLARE
        owner_role text;
        effort_hours numeric;
      BEGIN
        IF info_assurer_days >= security_architect_days AND info_assurer_days >= soc_analyst_days THEN
          owner_role := 'risk_manager';
          effort_hours := info_assurer_days * 8; -- Convert days to hours
        ELSIF security_architect_days >= soc_analyst_days THEN
          owner_role := 'security_architect';
          effort_hours := security_architect_days * 8;
        ELSE
          owner_role := 'soc';
          effort_hours := soc_analyst_days * 8;
        END IF;

        -- Insert the deliverable assignment
        INSERT INTO public.project_deliverable_assignments (
          project_id,
          deliverable_name,
          owner_role,
          effort_hours,
          due_date,
          required
        )
        VALUES (
          NEW.id,
          activity_name,
          owner_role,
          effort_hours,
          NULL, -- Due date will be calculated by timeline
          true  -- Default to required
        );
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to populate deliverables after project creation
DROP TRIGGER IF EXISTS trigger_populate_project_deliverables ON public.projects;
CREATE TRIGGER trigger_populate_project_deliverables
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_project_deliverables();