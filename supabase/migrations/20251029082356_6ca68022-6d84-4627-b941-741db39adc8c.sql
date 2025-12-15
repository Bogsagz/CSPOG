-- Drop the constraint if it exists (in case it's in a bad state)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_members_user_id_fkey'
        AND table_name = 'project_members'
    ) THEN
        ALTER TABLE public.project_members DROP CONSTRAINT project_members_user_id_fkey;
    END IF;
END $$;

-- Add foreign key relationship between project_members and profiles
ALTER TABLE public.project_members
ADD CONSTRAINT project_members_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Also add foreign key for project_id to projects table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'project_members_project_id_fkey'
        AND table_name = 'project_members'
    ) THEN
        ALTER TABLE public.project_members
        ADD CONSTRAINT project_members_project_id_fkey
        FOREIGN KEY (project_id)
        REFERENCES public.projects(id)
        ON DELETE CASCADE;
    END IF;
END $$;