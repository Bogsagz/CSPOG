-- Add disabled status to profiles
ALTER TABLE public.profiles 
ADD COLUMN disabled boolean DEFAULT false NOT NULL;