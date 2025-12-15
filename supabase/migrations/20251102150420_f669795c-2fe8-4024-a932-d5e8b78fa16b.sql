-- Remove 'signal' from workstream enum by recreating it with all other values
-- First, create a new enum without 'signal'
CREATE TYPE workstream_new AS ENUM ('Mig', 'IE', 'Land', 'Sea', 'Plat');

-- Update profiles table to use new enum
ALTER TABLE profiles 
  ALTER COLUMN workstream TYPE workstream_new 
  USING workstream::text::workstream_new;

-- Update projects table to use new enum
ALTER TABLE projects 
  ALTER COLUMN workstream TYPE workstream_new 
  USING workstream::text::workstream_new;

-- Drop old enum and rename new one
DROP TYPE workstream;
ALTER TYPE workstream_new RENAME TO workstream;