/**
 * Script to migrate existing users from custom auth to Supabase Auth
 * 
 * This script:
 * 1. Fetches all users from the custom users table
 * 2. Creates Supabase Auth accounts for each user
 * 3. Generates temporary passwords and sends reset emails
 * 4. Links auth.users to public.users via auth_user_id
 * 
 * Usage: 
 *   npm run migrate-auth
 * 
 * Or with tsx:
 *   npx tsx scripts/migrate-users-to-supabase-auth.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface ExistingUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  location: string;
  skills: string[];
  weekly_capacity_hrs: number;
  avatar_url: string;
  auth_user_id?: string;
}

async function migrateUsers() {
  console.log('🚀 Starting user migration to Supabase Auth...\n');

  try {
    // Step 1: Fetch all users from public.users table
    console.log('📋 Fetching existing users...');
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .is('auth_user_id', null); // Only migrate users without auth_user_id

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log('✅ No users to migrate. All users are already linked to Supabase Auth.');
      return;
    }

    console.log(`Found ${existingUsers.length} users to migrate\n`);

    // Step 2: Migrate each user
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const user of existingUsers as ExistingUser[]) {
      try {
        console.log(`Migrating user: ${user.email}...`);

        // Generate a temporary password
        const tempPassword = generateSecurePassword();

        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: false, // Require email confirmation
          user_metadata: {
            username: user.username,
            name: user.name,
            role: user.role,
            location: user.location,
            skills: user.skills,
            weekly_capacity_hrs: user.weekly_capacity_hrs,
            avatar_url: user.avatar_url
          }
        });

        if (authError) {
          throw new Error(`Auth creation failed: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('No user returned from auth creation');
        }

        // Step 3: Update public.users with auth_user_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_user_id: authData.user.id })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`Failed to link user: ${updateError.message}`);
        }

        // Step 4: Send password reset email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${process.env.URL || 'http://localhost:5173'}/auth/reset-password`
        });

        if (resetError) {
          console.warn(`  ⚠️  Warning: Failed to send reset email: ${resetError.message}`);
        }

        console.log(`  ✅ Successfully migrated ${user.email}`);
        successCount++;

      } catch (error: any) {
        console.error(`  ❌ Failed to migrate ${user.email}: ${error.message}`);
        errors.push({ email: user.email, error: error.message });
        errorCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 5: Summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount} users`);
    console.log(`❌ Failed: ${errorCount} users`);
    
    if (errors.length > 0) {
      console.log('\nFailed Migrations:');
      errors.forEach(({ email, error }) => {
        console.log(`  - ${email}: ${error}`);
      });
    }

    console.log('\n📧 Password reset emails have been sent to all migrated users.');
    console.log('Users must confirm their email and set a new password before logging in.');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Generate a secure random password
function generateSecurePassword(): string {
  const length = 20;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Use crypto for secure random generation
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

