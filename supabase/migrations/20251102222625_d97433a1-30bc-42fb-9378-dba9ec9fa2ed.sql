-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Extract username from existing email addresses
UPDATE public.profiles
SET username = SPLIT_PART(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Create unique index on username for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles(username);

-- Create function to get email from username
CREATE OR REPLACE FUNCTION public.get_email_from_username(input_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- Try to find email by username
  SELECT email INTO user_email
  FROM public.profiles
  WHERE username = input_username;
  
  RETURN user_email;
END;
$$;

-- Update trigger to set username for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    SPLIT_PART(new.email, '@', 1)
  );
  RETURN new;
END;
$$;