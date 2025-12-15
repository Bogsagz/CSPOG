-- Add analytics column to attack_detections table
ALTER TABLE public.attack_detections 
ADD COLUMN analytics text;