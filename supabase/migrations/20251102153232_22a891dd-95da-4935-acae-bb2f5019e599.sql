-- Step 1: Drop the trigger that auto-assigns creator as risk_owner
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
DROP FUNCTION IF EXISTS public.add_creator_as_risk_owner();

-- Step 2: Update all existing risk_owner assignments to risk_manager
UPDATE public.project_members
SET role = 'risk_manager'::project_role
WHERE role = 'risk_owner'::project_role;

-- Step 3: Update the user_project_role function to handle the migration
-- (This function should continue to work as it just returns the role from project_members)