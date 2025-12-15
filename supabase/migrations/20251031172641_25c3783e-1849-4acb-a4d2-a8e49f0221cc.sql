-- Add is_completed column to project_deliverable_assignments table
ALTER TABLE project_deliverable_assignments 
ADD COLUMN is_completed boolean NOT NULL DEFAULT false;