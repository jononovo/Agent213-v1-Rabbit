/**
 * Test Direct Webhook Implementation
 * 
 * This script tests the new direct webhook implementation where webhooks are
 * sent directly to the integration engine without going through the main server.
 */

import fetch from 'node-fetch';

// Configuration
const MAIN_SERVER_URL = 'http://localhost:5000';
const INTEGRATION_ENGINE_URL = 'http://localhost:3001';
const WORKFLOW_EXECUTION_URL = 'http://localhost:3002';

/**
 * Check if the server is running
 */
async function checkServer(port: number, name: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`);
    if (response.ok) {
      console.log(`✅ ${name} is running on port ${port}`);
      return true;
    } else {
      console.log(`❌ ${name} on port ${port} returned non-OK response: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} is NOT running on port ${port}: ${error}`);
    return false;
  }
}

/**
 * Test the direct webhook endpoint
 */
async function testDirectWebhook() {
  console.log('\n🔄 Testing direct webhook to integration engine...');
  
  try {
    // Test with a direct webhook request
    const response = await fetch(
      `${INTEGRATION_ENGINE_URL}/webhooks/workflow/1/node/webhook_trigger-1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          message: 'This is a direct webhook test',
          timestamp: Date.now()
        })
      }
    );
    
    const responseText = await response.text();
    console.log(`🔄 Direct webhook response status: ${response.status}`);
    console.log(`🔄 Direct webhook response: ${responseText}`);
    
    return response.ok;
  } catch (error) {
    console.error('❌ Error testing direct webhook:', error);
    return false;
  }
}

/**
 * Test the legacy redirect endpoint
 */
async function testLegacyRedirect() {
  console.log('\n🔄 Testing legacy webhook redirect through main server...');
  
  try {
    // Test with a legacy webhook request that should be redirected
    const response = await fetch(
      `${MAIN_SERVER_URL}/api/webhooks/workflow/1/node/webhook_trigger-1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: true,
          message: 'This is a legacy webhook redirect test',
          timestamp: Date.now()
        })
      }
    );
    
    const responseText = await response.text();
    console.log(`🔄 Legacy webhook response status: ${response.status}`);
    console.log(`🔄 Legacy webhook response: ${responseText}`);
    
    return response.ok;
  } catch (error) {
    console.error('❌ Error testing legacy webhook redirect:', error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🔍 Testing webhook architecture...');
  
  // Check if servers are running
  const mainServerRunning = await checkServer(5000, 'Main Server');
  const integrationEngineRunning = await checkServer(3001, 'Integration Engine');
  const workflowExecutionRunning = await checkServer(3002, 'Workflow Execution');
  
  if (!mainServerRunning || !integrationEngineRunning || !workflowExecutionRunning) {
    console.error('❌ Cannot proceed with tests because one or more servers are not running.');
    process.exit(1);
  }
  
  // Run tests
  const directWebhookSuccess = await testDirectWebhook();
  console.log(directWebhookSuccess ? '✅ Direct webhook test passed' : '❌ Direct webhook test failed');
  
  const legacyRedirectSuccess = await testLegacyRedirect();
  console.log(legacyRedirectSuccess ? '✅ Legacy webhook redirect test passed' : '❌ Legacy webhook redirect test failed');
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Direct webhook test: ${directWebhookSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`Legacy webhook redirect test: ${legacyRedirectSuccess ? 'PASSED' : 'FAILED'}`);
  
  if (directWebhookSuccess && legacyRedirectSuccess) {
    console.log('✅ All tests passed! The webhook architecture is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the logs for details.');
    process.exit(1);
  }
}

// Run the tests if this is the main module
if (import.meta.url.endsWith(process.argv[1])) {
  runTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

export { runTests, testDirectWebhook, testLegacyRedirect };