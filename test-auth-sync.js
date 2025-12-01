// Test to reproduce the authentication synchronization issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khukxqhbzekvklfwbfsx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodWt4cWhiemVrdmtsZndiZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTg2NzYsImV4cCI6MjA3NDIzNDY3Nn0.njPfgptGcPeLaCOwNhqvQDPyzUJShJFAWdB2gdMCQwA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthSync() {
  console.log('=== Testing Authentication Synchronization ===');
  
  try {
    // Step 1: Test auth-me endpoint (simulating what the app does)
    console.log('\n1. Testing auth-me endpoint...');
    const authResponse = await fetch('https://deloitte-portal-dev.netlify.app/.netlify/functions/auth-me');
    console.log('Auth-me status:', authResponse.status);
    const authData = await authResponse.json();
    console.log('Auth-me response:', authData);
    
    // Step 2: Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await fetch('https://deloitte-portal-dev.netlify.app/.netlify/functions/auth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    // Step 3: Test auth-me again after login (with cookies)
    if (loginResponse.ok) {
      console.log('\n3. Testing auth-me after login...');
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('Login cookies:', cookies);
      
      const authResponse2 = await fetch('https://deloitte-portal-dev.netlify.app/.netlify/functions/auth-me', {
        headers: { 'Cookie': cookies }
      });
      console.log('Auth-me after login status:', authResponse2.status);
      const authData2 = await authResponse2.json();
      console.log('Auth-me after login response:', authData2);
    }
    
    // Step 4: Test API layer getCurrentUser
    console.log('\n4. Testing API layer getCurrentUser...');
    const { getCurrentUser } = await import('./services/api.js');
    const currentUser = await getCurrentUser();
    console.log('API getCurrentUser result:', currentUser);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuthSync();
