-- Add type column to assets table
ALTER TABLE public.assets 
ADD COLUMN type text;