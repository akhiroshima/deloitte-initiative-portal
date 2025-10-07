// Minimal reproducible test case for registration failure
const testRegistration = async () => {
  const testData = {
    username: "testuser666",
    name: "Test User 666", 
    role: "Developer",
    location: "Bangalore",
    skills: ["React"],
    weeklyCapacityHrs: 20
  };

  try {
    const response = await fetch('https://deloitte-portal-dev.netlify.app/.netlify/functions/auth-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 201 && result.ok) {
      console.log('✅ TEST PASSED: Registration successful');
      return true;
    } else {
      console.log('❌ TEST FAILED: Registration failed');
      console.log('Error details:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
    return false;
  }
};

// Run the test
testRegistration();
