import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - single instance for the entire frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Some features may not work.');
}

// Use createClient<Database>(...) with types from types/supabase.ts once generated via `npx supabase gen types typescript`
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Use localStorage for session persistence
    storageKey: 'supabase.auth.token', // Custom storage key
  },
}) : null;

// Helper function to check if database is available
export const isDatabaseAvailable = () => {
  return supabase !== null;
};
