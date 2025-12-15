-- Ensure unique constraint exists for user per project
-- Drop existing constraint if it exists with different name
DO $$ 
BEGIN
    -- Try to add unique constraint, will fail if it already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_per_project' 
        AND conrelid = 'project_members'::regclass
    ) THEN
        ALTER TABLE public.project_members
        ADD CONSTRAINT unique_user_per_project UNIQUE (user_id, project_id);
    END IF;
END $$;