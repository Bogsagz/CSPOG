-- Add workstream enum type
CREATE TYPE public.workstream AS ENUM ('Mig', 'IE', 'Land', 'Sea', 'Plat');

-- Add workstream to projects table
ALTER TABLE public.projects ADD COLUMN workstream workstream NULL;

-- Add workstream to profiles table
ALTER TABLE public.profiles ADD COLUMN workstream workstream NULL;