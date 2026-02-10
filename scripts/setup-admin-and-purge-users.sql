-- Setup Admin Account and Purge All Existing Users
-- This script will:
-- 1. Delete all existing users from both auth.users and public.users
-- 2. Create a fresh admin account (username: admin, password: admin1234)
-- 3. Mark the admin account as email-confirmed so it can log in immediately

-- IMPORTANT: This will permanently delete ALL users in the database
-- Only run this on the DEVELOPMENT database!

-- Step 1: Delete all existing users from public.users first
-- (This will cascade delete related records like initiatives, tasks, notifications, etc.)
TRUNCATE TABLE public.users CASCADE;

-- Step 2: Delete all Supabase Auth users
-- Note: This requires special permissions, so we'll use the auth.users table directly
DELETE FROM auth.users;

-- Step 3: Create the admin user in Supabase Auth
-- We'll insert directly into auth.users with a pre-hashed password
-- Password: admin1234 (bcrypt hashed)
-- Note: Supabase uses bcrypt for password hashing

-- First, we need to create the auth user with the raw_user_meta_data that will be used by the trigger
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@deloitte.com',
  -- Bcrypt hash for 'admin1234' - generated using Supabase's auth.crypt function
  crypt('admin1234', gen_salt('bf')),
  now(), -- Email confirmed immediately
  jsonb_build_object(
    'username', 'admin',
    'name', 'Admin User',
    'role', 'Admin',
    'location', 'Global',
    'skills', jsonb_build_array('Administration', 'Management'),
    'weekly_capacity_hrs', 40,
    'avatar_url', 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488'
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Step 4: Update the public.users entry to mark as admin
-- The trigger should have created the user, now we need to ensure is_admin is true
UPDATE public.users
SET is_admin = true, needs_password_change = false
WHERE email = 'admin@deloitte.com';

-- Step 5: Verify the setup
SELECT 
  u.id,
  u.email,
  u.username,
  u.name,
  u.role,
  u.is_admin,
  u.auth_user_id,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'Email Confirmed'
    ELSE 'Email Not Confirmed'
  END as email_status
FROM public.users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
ORDER BY u.created_at;

-- Result should show:
-- 1 row with admin@deloitte.com, username: admin, is_admin: true, Email Confirmed









