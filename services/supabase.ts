import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - single instance for the entire frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Some features may not work.');
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper function to check if database is available
export const isDatabaseAvailable = () => {
  return supabase !== null;
};
