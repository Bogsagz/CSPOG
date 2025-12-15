-- Step 1: Drop policies and functions that depend on project_role enum
DROP POLICY IF EXISTS "Risk owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project members can be added" ON project_members;
DROP FUNCTION IF EXISTS user_project_role(uuid, uuid);

-- Step 2: Migrate any 'mentor' values to 'project_delivery'
UPDATE project_members 
SET role = 'project_delivery'::project_role 
WHERE role = 'mentor'::project_role;

-- Step 3: Create new enum without 'mentor'
ALTER TYPE project_role RENAME TO project_role_old;

CREATE TYPE project_role AS ENUM (
  'project_owner',
  'project_admin',
  'security_architect',
  'risk_manager',
  'soc',
  'project_delivery'
);

-- Step 4: Update column to use new enum
ALTER TABLE project_members 
  ALTER COLUMN role TYPE project_role 
  USING role::text::project_role;

-- Step 5: Drop old enum with CASCADE to handle any remaining dependencies
DROP TYPE project_role_old CASCADE;

-- Step 6: Recreate the user_project_role function with updated enum
CREATE OR REPLACE FUNCTION public.user_project_role(_user_id uuid, _project_id uuid)
RETURNS project_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.project_members
  WHERE user_id = _user_id
  AND project_id = _project_id
  LIMIT 1
$function$;

-- Step 7: Recreate RLS policies with updated role references
CREATE POLICY "Project owners can update projects" 
ON projects
FOR UPDATE
USING (user_project_role(auth.uid(), id) = 'project_owner'::project_role);

CREATE POLICY "Project members can be added" 
ON project_members
FOR INSERT
WITH CHECK (
  user_is_security_admin() 
  OR (
    EXISTS (
      SELECT 1
      FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'project_owner'::project_role
    )
  )
);