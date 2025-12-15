-- Drop existing trigger and function with CASCADE
DROP TRIGGER IF EXISTS on_auth_login ON auth.users;
DROP FUNCTION IF EXISTS update_last_login() CASCADE;

-- Function to update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET last_login = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to update last_login on sign in
CREATE TRIGGER on_auth_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_last_login();