-- Rename 'user' to 'security_user' in app_role enum (user_roles table)
ALTER TYPE app_role RENAME VALUE 'user' TO 'security_user';

-- Rename 'security_admin' to 'admin' in project_role enum (profiles.primary_role)
ALTER TYPE project_role RENAME VALUE 'security_admin' TO 'admin';

-- Note: There's no 'security_delivery' in project_role - it's called 'project_delivery'
-- If you meant to rename project_delivery to delivery, uncomment this:
-- ALTER TYPE project_role RENAME VALUE 'project_delivery' TO 'delivery';