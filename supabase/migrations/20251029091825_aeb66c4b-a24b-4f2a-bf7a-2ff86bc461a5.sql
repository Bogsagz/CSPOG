-- Add first name and last name to profiles
ALTER TABLE public.profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text;