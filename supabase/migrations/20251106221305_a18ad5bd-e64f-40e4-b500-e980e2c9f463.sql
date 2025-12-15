-- Step 1: Create new organizational_role enum for profiles.primary_role
-- This represents a user's job function in the organization
CREATE TYPE public.organizational_role AS ENUM (
  'risk_manager',
  'security_architect',
  'soc_analyst',
  'project_manager',
  'admin_staff'
);

-- Step 2: Add temporary column with new enum type
ALTER TABLE public.profiles 
ADD COLUMN new_primary_role organizational_role;

-- Step 3: Migrate existing data from primary_role to new_primary_role
-- Map old project_role values to organizational_role values
UPDATE public.profiles
SET new_primary_role = CASE 
  WHEN primary_role::text = 'admin' THEN 'admin_staff'::organizational_role
  WHEN primary_role::text = 'risk_manager' THEN 'risk_manager'::organizational_role
  WHEN primary_role::text = 'security_architect' THEN 'security_architect'::organizational_role
  WHEN primary_role::text = 'soc' THEN 'soc_analyst'::organizational_role
  WHEN primary_role::text = 'project_delivery' THEN 'project_manager'::organizational_role
  ELSE NULL
END
WHERE primary_role IS NOT NULL;

-- Step 4: Drop old primary_role column
ALTER TABLE public.profiles 
DROP COLUMN primary_role;

-- Step 5: Rename new column to primary_role
ALTER TABLE public.profiles 
RENAME COLUMN new_primary_role TO primary_role;

-- Step 6: Refine project_role enum to be clearer about project-specific permissions
-- First, update existing values that need renaming
ALTER TYPE project_role RENAME VALUE 'risk_owner' TO 'project_owner';
ALTER TYPE project_role RENAME VALUE 'admin' TO 'project_admin';

-- The final project_role enum now contains:
-- 'project_owner' (full control over project)
-- 'project_admin' (can manage team and settings)
-- 'security_architect' (can write tables and threats)
-- 'risk_manager' (can manage risks and team)
-- 'soc' (can write threats)
-- 'project_delivery' (delivery team role)

-- Note: app_role enum (for user_roles table) remains unchanged:
-- 'security_admin', 'security_user', 'security_delivery'