/**
 * Setup Admin Account and Purge Users Script
 * 
 * This script will:
 * 1. Delete all existing users from the database
 * 2. Create a fresh admin account with credentials:
 *    - Username: admin
 *    - Email: admin@deloitte.com
 *    - Password: admin1234
 * 
 * Usage:
 *   npx tsx scripts/setup-admin-account.ts
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (has admin permissions)
 */

import { createClient } from '@supabase/supabase-js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function setupAdminAccount() {
  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    log('\n❌ ERROR: Missing required environment variables', colors.red);
    log('Please set:', colors.yellow);
    log('  - SUPABASE_URL', colors.yellow);
    log('  - SUPABASE_SERVICE_ROLE_KEY', colors.yellow);
    log('\nYou can set them temporarily with:', colors.cyan);
    log('  export SUPABASE_URL=your_url', colors.cyan);
    log('  export SUPABASE_SERVICE_ROLE_KEY=your_key', colors.cyan);
    process.exit(1);
  }

  // Create Supabase admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  log('\n🚀 Starting admin account setup...', colors.cyan);
  log('⚠️  WARNING: This will DELETE ALL existing users!', colors.yellow);
  
  try {
    // Step 1: Get current user count
    log('\n📊 Auditing current users...', colors.blue);
    const { data: currentUsers, error: countError } = await supabase
      .from('users')
      .select('id, email, username, name', { count: 'exact' });
    
    if (countError) {
      throw new Error(`Failed to count users: ${countError.message}`);
    }
    
    log(`   Found ${currentUsers?.length || 0} existing users`, colors.blue);
    if (currentUsers && currentUsers.length > 0) {
      currentUsers.forEach(user => {
        log(`   - ${user.username} (${user.email})`, colors.blue);
      });
    }

    // Step 2: Delete all users from public.users (cascades will clean up related data)
    log('\n🗑️  Purging all existing users from public.users...', colors.yellow);
    const { error: deletePublicError } = await supabase
      .from('users')
      .delete()
      .neq('id', ''); // Match all records
    
    if (deletePublicError) {
      throw new Error(`Failed to delete public users: ${deletePublicError.message}`);
    }
    log('   ✓ Public users deleted', colors.green);

    // Step 3: Delete all Supabase Auth users using admin API
    log('\n🗑️  Purging all Supabase Auth users...', colors.yellow);
    
    // List all auth users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list auth users: ${listError.message}`);
    }
    
    // Delete each auth user
    if (authUsers && authUsers.users.length > 0) {
      for (const authUser of authUsers.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
        if (deleteError) {
          log(`   ⚠️  Warning: Failed to delete auth user ${authUser.email}: ${deleteError.message}`, colors.yellow);
        }
      }
      log(`   ✓ Deleted ${authUsers.users.length} auth users`, colors.green);
    } else {
      log('   ✓ No auth users to delete', colors.green);
    }

    // Step 4: Create new admin user with Supabase Auth
    log('\n👤 Creating admin account...', colors.blue);
    
    const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@deloitte.com',
      password: 'admin1234',
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        username: 'admin',
        name: 'Admin User',
        role: 'Admin',
        location: 'Global',
        skills: ['Administration', 'Management'],
        weekly_capacity_hrs: 40,
        avatar_url: 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488',
      },
    });

    if (createAuthError) {
      throw new Error(`Failed to create auth user: ${createAuthError.message}`);
    }

    log('   ✓ Supabase Auth user created', colors.green);
    log(`   Auth User ID: ${newAuthUser.user.id}`, colors.cyan);

    // Step 5: Wait a moment for the trigger to create the public.users entry
    log('\n⏳ Waiting for database trigger to create profile...', colors.blue);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Update the public.users entry to ensure admin flags are set
    log('\n🔧 Updating admin permissions...', colors.blue);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_admin: true,
        needs_password_change: false,
      })
      .eq('email', 'admin@deloitte.com');

    if (updateError) {
      throw new Error(`Failed to update admin permissions: ${updateError.message}`);
    }
    log('   ✓ Admin permissions set', colors.green);

    // Step 7: Verify the setup
    log('\n✅ Verifying setup...', colors.blue);
    const { data: adminUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@deloitte.com')
      .single();

    if (verifyError || !adminUser) {
      throw new Error('Failed to verify admin user creation');
    }

    log('\n✅ SUCCESS! Admin account created:', colors.green);
    log(`   Username:  admin`, colors.cyan);
    log(`   Email:     admin@deloitte.com`, colors.cyan);
    log(`   Password:  admin1234`, colors.cyan);
    log(`   Role:      ${adminUser.role}`, colors.cyan);
    log(`   Is Admin:  ${adminUser.is_admin}`, colors.cyan);
    log(`   User ID:   ${adminUser.id}`, colors.cyan);

    log('\n🎉 Setup complete! You can now log in to the app with:', colors.green);
    log('   Username: admin', colors.magenta);
    log('   Password: admin1234', colors.magenta);
    log('\n🌐 Set URL in Netlify env to your site (e.g. https://your-site.netlify.app)', colors.cyan);

  } catch (error) {
    log(`\n❌ ERROR: ${error instanceof Error ? error.message : String(error)}`, colors.red);
    process.exit(1);
  }
}

// Run the script
setupAdminAccount().catch((error) => {
  log(`\n❌ Unexpected error: ${error}`, colors.red);
  process.exit(1);
});









