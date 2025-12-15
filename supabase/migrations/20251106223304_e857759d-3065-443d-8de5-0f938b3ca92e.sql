-- Step 1: Create new organizational_role enum with updated roles
ALTER TYPE organizational_role RENAME TO organizational_role_old;

CREATE TYPE organizational_role AS ENUM (
  'delivery',
  'security_architect',
  'risk_manager',
  'sec_mon',
  'sec_eng',
  'sa_mentor',
  'ia_mentor',
  'admin'
);

-- Step 2: Migrate existing data to new roles
ALTER TABLE profiles 
  ALTER COLUMN primary_role TYPE organizational_role 
  USING (
    CASE primary_role::text
      WHEN 'admin_staff' THEN 'admin'::organizational_role
      WHEN 'project_manager' THEN 'delivery'::organizational_role
      WHEN 'security_architect' THEN 'security_architect'::organizational_role
      WHEN 'risk_manager' THEN 'risk_manager'::organizational_role
      WHEN 'soc_analyst' THEN 'sec_mon'::organizational_role
      ELSE 'delivery'::organizational_role
    END
  );

-- Step 3: Drop old enum
DROP TYPE organizational_role_old;