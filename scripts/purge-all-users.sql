-- Purge all users from the database (no admin creation).
-- Use this for a clean slate. Run via Supabase Dashboard SQL Editor or:
--   psql "$SUPABASE_DB_URL" -f scripts/purge-all-users.sql
--
-- To create a single admin after purge, run scripts/setup-admin-and-purge-users.sql
-- (that script does purge + admin in one go) or run setup-admin-via-sql.sh.

TRUNCATE TABLE public.users CASCADE;
DELETE FROM auth.users;
