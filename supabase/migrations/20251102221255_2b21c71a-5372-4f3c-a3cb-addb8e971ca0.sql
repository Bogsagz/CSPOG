-- Add last_login column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN last_login timestamp with time zone;

-- Create a function to update last_login timestamp
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger to update last_login on auth state changes
-- Note: This will be called when users authenticate
CREATE TRIGGER on_auth_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.update_last_login();