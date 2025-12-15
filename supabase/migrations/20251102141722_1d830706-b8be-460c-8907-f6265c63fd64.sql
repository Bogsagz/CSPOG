-- Update populate_project_deliverables to avoid duplicate inserts
CREATE OR REPLACE FUNCTION public.populate_project_deliverables()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  timeline_activities jsonb;
  activity jsonb;
  activity_name text;
  info_assurer_days numeric;
  security_architect_days numeric;
  soc_analyst_days numeric;
  is_milestone boolean;
  cumulative_days numeric := 0;
  calculated_due_date date;
BEGIN
  -- Get timeline activities from app_settings
  SELECT setting_value INTO timeline_activities
  FROM public.app_settings
  WHERE setting_key = 'timeline_activities';

  -- If no timeline activities found or project has no start date, skip
  IF timeline_activities IS NULL OR NEW.project_start IS NULL THEN
    RETURN NEW;
  END IF;

  -- Loop through each activity and create deliverable assignments with calculated due dates
  FOR activity IN SELECT * FROM jsonb_array_elements(timeline_activities)
  LOOP
    activity_name := activity->>'name';
    info_assurer_days := (activity->>'infoAssurerDays')::numeric;
    security_architect_days := (activity->>'securityArchitectDays')::numeric;
    soc_analyst_days := (activity->>'socAnalystDays')::numeric;
    is_milestone := COALESCE((activity->>'isMilestone')::boolean, false);

    -- Only create deliverables for non-milestone activities
    IF NOT is_milestone THEN
      -- Calculate due date based on cumulative days from project start
      calculated_due_date := NEW.project_start + (cumulative_days || ' days')::interval;
      
      -- Determine the primary owner based on who has the most effort
      DECLARE
        owner_role text;
        effort_hours numeric;
        activity_days numeric;
      BEGIN
        IF info_assurer_days >= security_architect_days AND info_assurer_days >= soc_analyst_days THEN
          owner_role := 'risk_manager';
          activity_days := info_assurer_days;
        ELSIF security_architect_days >= soc_analyst_days THEN
          owner_role := 'security_architect';
          activity_days := security_architect_days;
        ELSE
          owner_role := 'soc';
          activity_days := soc_analyst_days;
        END IF;

        effort_hours := activity_days * 8; -- Convert days to hours

        -- Insert the deliverable assignment with calculated due date, avoiding duplicates
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
          calculated_due_date,
          true
        )
        ON CONFLICT (project_id, deliverable_name) DO NOTHING;
        
        -- Add this activity's days to cumulative total
        cumulative_days := cumulative_days + activity_days;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;
