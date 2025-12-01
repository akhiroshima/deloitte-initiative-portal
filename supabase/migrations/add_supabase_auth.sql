-- Migration: Add Supabase Auth integration
-- This migration adds auth_user_id column and creates triggers to sync Supabase Auth with custom users table

-- Step 1: Add auth_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create unique index on auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_idx ON users(auth_user_id);

-- Step 3: Make password_hash nullable (will be removed after migration)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Step 4: Create function to handle new Supabase Auth users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    auth_user_id,
    email,
    username,
    name,
    role,
    location,
    skills,
    weekly_capacity_hrs,
    avatar_url,
    needs_password_change
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Developer'),
    COALESCE(NEW.raw_user_meta_data->>'location', 'Remote'),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills')),
      ARRAY[]::text[]
    ),
    COALESCE((NEW.raw_user_meta_data->>'weekly_capacity_hrs')::integer, 40),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://ui-avatars.com/api/?name=' || encode(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))::bytea, 'escape') || '&background=random'
    ),
    false
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Step 6: Add email domain validation function (will be used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_valid_email_domain(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed_domain text;
BEGIN
  allowed_domain := 'deloitte.com'; -- Can be made configurable
  RETURN email LIKE '%@' || allowed_domain;
END;
$$;

-- Step 7: Add comment for documentation
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Automatically creates a user profile when a new user signs up via Supabase Auth';
COMMENT ON FUNCTION public.is_valid_email_domain(email text) IS 'Validates that email belongs to allowed domain (deloitte.com)';

