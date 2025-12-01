# Authentication System Documentation

## Overview

The Nammastudio Initiative Portal uses **Supabase Auth** for authentication, providing secure, scalable user management with email verification and password reset capabilities.

## Architecture

### Components

1. **Supabase Auth** - Handles user authentication, session management, and email verification
2. **Custom Users Table** - Stores additional user profile data (skills, location, capacity, etc.)
3. **Database Triggers** - Automatically syncs Supabase Auth users to the custom users table
4. **Netlify Functions** - Backend API endpoints for authentication operations
5. **Frontend (React)** - User interface for authentication flows

### Data Flow

```
User Registration
  ↓
Supabase Auth (creates auth.users entry)
  ↓
Database Trigger (creates public.users entry)
  ↓
Email Verification Sent
  ↓
User Confirms Email
  ↓
User Can Log In
```

## Features

### 1. Email/Password Authentication
- Users register with their `@deloitte.com` (or configured domain) email address
- Passwords are securely hashed by Supabase Auth
- **Email verification required** before users can log in

### 2. Email Domain Restriction
- Only emails from the configured domain (`@deloitte.com` by default) are allowed
- Enforced both at the backend and through Supabase Edge Function webhook
- Prevents unauthorized registrations

### 3. Session Management
- JWT-based sessions stored in HTTP-only cookies
- Automatic token refresh
- Session persistence across page reloads using localStorage
- 7-day session expiry (configurable)

### 4. Password Reset
- Users can request password reset via email
- Secure reset links with expiration
- No email enumeration (always returns success to prevent information disclosure)

### 5. User Profile Sync
- User metadata automatically synced from Supabase Auth to custom users table
- Trigger function handles the synchronization
- Supports additional profile fields (skills, location, capacity, avatar)

## Configuration

### Environment Variables

**Required:**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For migrations and admin operations

# Email Domain
ALLOWED_EMAIL_DOMAIN=deloitte.com

# Site URL (for email redirects)
URL=https://your-site.netlify.app
```

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Dashboard Settings

1. **Authentication → Providers → Email**
   - ✅ Enable Email provider
   - ❌ Disable "Confirm email" (we want email verification)
   - Set "Site URL" to your production domain
   - Add "Redirect URLs" for dev and prod environments

2. **Authentication → Email Templates**
   - Customize confirmation email template
   - Customize password reset email template
   - Set redirect URLs to your application routes

3. **Authentication → URL Configuration**
   - Site URL: `https://your-site.netlify.app`
   - Redirect URLs:
     - `http://localhost:5173/auth/callback`
     - `https://your-site.netlify.app/auth/callback`
     - `https://your-dev-site.netlify.app/auth/callback`

## API Endpoints

### POST `/auth-register`
Register a new user.

**Request:**
```json
{
  "username": "john.doe",
  "name": "John Doe",
  "role": "Developer",
  "location": "New York",
  "skills": ["React", "TypeScript", "Node.js"],
  "weeklyCapacityHrs": 40,
  "password": "optional-password"  // If not provided, one is generated
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Registration successful! Please check your email to confirm your account.",
  "requiresEmailConfirmation": true,
  "user": {
    "id": "uuid",
    "email": "john.doe@deloitte.com",
    "username": "john.doe",
    "name": "John Doe",
    ...
  }
}
```

### POST `/auth-login`
Log in an existing user.

**Request:**
```json
{
  "username": "john.doe",
  "password": "user-password"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    ...
  },
  "user": {
    "id": "uuid",
    "email": "john.doe@deloitte.com",
    ...
  }
}
```

**Response (Email Not Confirmed):**
```json
{
  "error": "Please confirm your email address before logging in."
}
```

### GET `/auth-me`
Check current authentication status.

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "john.doe@deloitte.com",
    ...
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

### POST `/auth-logout`
Log out the current user.

**Response:**
```json
{
  "ok": true,
  "message": "Logged out successfully"
}
```

### POST `/auth-reset-password`
Request a password reset email.

**Request:**
```json
{
  "username": "john.doe"
  // OR
  "email": "john.doe@deloitte.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "If an account exists with this email, you will receive password reset instructions shortly."
}
```

## Database Schema

### `auth.users` (Supabase Auth)
Managed by Supabase Auth. Contains:
- `id` (UUID) - Primary key
- `email` - User's email address
- `encrypted_password` - Hashed password
- `email_confirmed_at` - Timestamp of email confirmation
- `user_metadata` - JSONB field with additional user data

### `public.users` (Custom Table)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- Deprecated, will be removed after migration
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  weekly_capacity_hrs INTEGER NOT NULL DEFAULT 40,
  avatar_url TEXT,
  needs_password_change BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    auth_user_id, email, username, name, role, 
    location, skills, weekly_capacity_hrs, avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Developer'),
    COALESCE(NEW.raw_user_meta_data->>'location', 'Remote'),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills')), ARRAY[]::text[]),
    COALESCE((NEW.raw_user_meta_data->>'weekly_capacity_hrs')::integer, 40),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || encode(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))::bytea, 'escape') || '&background=random')
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
```

## Migration Guide

### Migrating Existing Users

If you have existing users in the custom `users` table, use the migration script:

```bash
# Ensure environment variables are set
export SUPABASE_URL=your-url
export SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Run migration
npx tsx scripts/migrate-users-to-supabase-auth.ts
```

**What the migration does:**
1. Fetches all users without `auth_user_id` from `public.users`
2. Creates Supabase Auth accounts for each user
3. Generates temporary passwords
4. Links `auth.users` to `public.users` via `auth_user_id`
5. Sends password reset emails to all migrated users

**Important:** Users will need to:
1. Check their email for the password reset link
2. Set a new password
3. Confirm their email address
4. Log in with their new credentials

## Security Features

### 1. Email Verification
- **Required before login** - Users cannot log in until they confirm their email
- Prevents account takeover and ensures valid email addresses
- Confirmation links expire after 24 hours

### 2. Password Security
- Passwords hashed using bcrypt (handled by Supabase Auth)
- Minimum 8 character requirement (configurable)
- Secure password reset flow with expiring tokens

### 3. Rate Limiting
- Login attempts limited to prevent brute force attacks
- Password reset requests rate-limited
- Registration rate-limited per IP address

### 4. Session Security
- HTTP-only cookies prevent XSS attacks
- Secure flag enforced in production (HTTPS only)
- SameSite=Lax prevents CSRF attacks
- Automatic token refresh
- 7-day session expiry with automatic cleanup

### 5. Email Enumeration Prevention
- Password reset always returns success (doesn't reveal if email exists)
- Login errors don't distinguish between invalid email vs invalid password

### 6. Domain Restriction
- Only configured domain emails allowed (`@deloitte.com`)
- Enforced at multiple layers (frontend, backend, database)
- Edge Function webhook for additional validation

## Troubleshooting

### Issue: Users can't log in after registration
**Cause:** Email not confirmed
**Solution:** Check spam folder for confirmation email, or resend confirmation email

### Issue: Password reset email not received
**Possible causes:**
- Email in spam folder
- Email not in database
- SMTP/email service configuration issue
**Solution:** Check Supabase logs, verify email settings

### Issue: "Invalid credentials" on login
**Possible causes:**
- Wrong password
- Email not confirmed
- User doesn't exist
**Solution:** Try password reset, check email confirmation status

### Issue: Session expires too quickly
**Cause:** Token expiry set too low
**Solution:** Adjust `Max-Age` in cookie settings (currently 7 days)

### Issue: "Only @deloitte.com emails allowed"
**Cause:** User trying to register with non-approved domain
**Solution:** Verify `ALLOWED_EMAIL_DOMAIN` environment variable is set correctly

## Testing

### Manual Testing Checklist

- [ ] Register new user with valid @deloitte.com email
- [ ] Receive confirmation email
- [ ] Confirm email via link
- [ ] Log in with confirmed account
- [ ] Try to log in without confirming email (should fail)
- [ ] Try to register with non-@deloitte.com email (should fail)
- [ ] Request password reset
- [ ] Receive password reset email
- [ ] Reset password via link
- [ ] Log in with new password
- [ ] Log out
- [ ] Verify session persists across page reload

### Automated Testing

```typescript
// Example test for registration
describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await fetch('/auth-register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'test.user',
        name: 'Test User',
        role: 'Developer',
        location: 'Test City',
        skills: ['Testing'],
        weeklyCapacityHrs: 40
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.requiresEmailConfirmation).toBe(true);
  });
});
```

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth API Reference](https://supabase.com/docs/reference/javascript/auth-api)
- [Email Verification Guide](https://supabase.com/docs/guides/auth/auth-email)
- [Password Reset Guide](https://supabase.com/docs/guides/auth/auth-password-reset)

