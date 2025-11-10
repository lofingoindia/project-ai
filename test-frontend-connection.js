// Frontend Backend Connectivity Test
// Open this in browser console to test backend connection

const testBackendConnection = async () => {
  try {
    const backendUrl = 'http://localhost:3002';
    console.log(`🔗 Testing connection to: ${backendUrl}`);
    
    const response = await fetch(`${backendUrl}/api/test`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Backend connection successful:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    
    if (error.message.includes('Failed to fetch')) {
      console.log('💡 Solutions:');
      console.log('   1. Make sure backend server is running: npm start');
      console.log('   2. Check if port 3002 is available');
      console.log('   3. Verify CORS is enabled on backend');
    }
    
    return false;
  }
};

// Run the test
testBackendConnection();