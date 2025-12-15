-- Create enum for project security phase
CREATE TYPE public.project_phase AS ENUM ('Discovery', 'Alpha', 'Live', 'Disposal');

-- Add security_phase column to projects table
ALTER TABLE public.projects 
ADD COLUMN security_phase public.project_phase DEFAULT 'Discovery';