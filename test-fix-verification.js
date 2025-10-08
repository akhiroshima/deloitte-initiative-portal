// Test to verify the authentication fix works
async function testAuthFix() {
  console.log('=== Testing Authentication Fix ===');
  
  try {
    // Step 1: Login (this should work)
    console.log('\n1. Testing login...');
    const loginResponse = await fetch('https://deloitte-portal-dev.netlify.app/.netlify/functions/auth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // This is the key fix
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login success:', loginData.ok);
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    
    // Step 2: Test auth-me with credentials (this should now work)
    console.log('\n2. Testing auth-me with credentials...');
    const authResponse = await fetch('https://deloitte-portal-dev.netlify.app/.netlify/functions/auth-me', {
      credentials: 'include' // This is the key fix
    });
    
    console.log('Auth-me status:', authResponse.status);
    const authData = await authResponse.json();
    console.log('Auth-me response:', authData);
    
    if (authResponse.ok && authData.authenticated) {
      console.log('✅ SUCCESS: Authentication is working!');
      console.log('User:', authData.user.name);
    } else {
      console.log('❌ FAILED: Authentication still not working');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuthFix();
