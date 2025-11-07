-- Create function to handle new user signup (app_users table only)
CREATE OR REPLACE FUNCTION public.handle_new_user_app_users()
RETURNS trigger AS $$
BEGIN
  -- Insert into app_users table only
  INSERT INTO public.app_users (full_name, email, role, is_active)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'user',
    true
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users for app_users table only
CREATE TRIGGER on_auth_user_created_app_users
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_app_users();

-- Ensure app_users table has proper RLS policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read app_users (for profile display)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read app_users" ON public.app_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow users to update their own profile in app_users
CREATE POLICY IF NOT EXISTS "Allow users to update own app_users profile" ON public.app_users
  FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- Create policy to allow insert for new users
CREATE POLICY IF NOT EXISTS "Enable insert for app_users" ON public.app_users
  FOR INSERT WITH CHECK (true);
