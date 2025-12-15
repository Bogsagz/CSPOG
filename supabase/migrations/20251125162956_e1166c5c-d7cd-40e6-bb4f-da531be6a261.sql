-- Make requirement_type nullable in requirements_repository
ALTER TABLE public.requirements_repository 
ALTER COLUMN requirement_type DROP NOT NULL;

-- Set a default value for existing records if needed
UPDATE public.requirements_repository 
SET requirement_type = 'security' 
WHERE requirement_type IS NULL;