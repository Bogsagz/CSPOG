-- Add fleet_size column to projects table
ALTER TABLE public.projects
ADD COLUMN fleet_size text CHECK (fleet_size IN ('X-Wing', 'Enterprise', 'Red Dwarf', 'Star Destroyer', 'Death Star'));