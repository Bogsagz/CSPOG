-- Step 1: Drop dependent policies and functions
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project members can be added" ON project_members;
DROP FUNCTION IF EXISTS user_project_role(uuid, uuid);

-- Step 2: Migrate existing project_members data to new roles
-- project_owner, project_admin, project_delivery → delivery
UPDATE project_members 
SET role = 'project_delivery'::project_role 
WHERE role IN ('project_owner'::project_role, 'project_admin'::project_role);

-- soc → will become sec_mon

-- Step 3: Create new project_role enum
ALTER TYPE project_role RENAME TO project_role_old;

CREATE TYPE project_role AS ENUM (
  'security_architect',
  'risk_manager',
  'sec_mon',
  'sec_eng',
  'delivery'
);

-- Step 4: Migrate data with new enum
-- Map old roles to new roles
ALTER TABLE project_members 
  ALTER COLUMN role TYPE project_role 
  USING (
    CASE role::text
      WHEN 'project_owner' THEN 'delivery'::project_role
      WHEN 'project_admin' THEN 'delivery'::project_role
      WHEN 'project_delivery' THEN 'delivery'::project_role
      WHEN 'soc' THEN 'sec_mon'::project_role
      WHEN 'security_architect' THEN 'security_architect'::project_role
      WHEN 'risk_manager' THEN 'risk_manager'::project_role
      ELSE 'delivery'::project_role
    END
  );

-- Step 5: Drop old enum
DROP TYPE project_role_old CASCADE;

-- Step 6: Recreate database function
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

-- Step 7: Recreate RLS policies with updated role checks
-- Delivery members (formerly project owners) can update projects
CREATE POLICY "Delivery members can update projects" 
ON projects
FOR UPDATE
USING (user_project_role(auth.uid(), id) = 'delivery'::project_role);

-- Security admins and delivery members can add team members
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
        AND pm.role = 'delivery'::project_role
    )
  )
);