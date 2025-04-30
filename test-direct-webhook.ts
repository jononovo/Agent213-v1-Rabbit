/**
 * Test Direct Webhook Implementation
 * 
 * This script tests the new direct webhook implementation where webhooks are
 * sent directly to the integration engine without going through the main server.
 */

import fetch from 'node-fetch';

/**
 * Check if the server is running
 */
async function checkServer(port: number, name: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`);
    if (response.ok) {
      console.log(`✓ ${name} is running on port ${port}`);
      return true;
    } else {
      console.error(`✗ ${name} is not responding properly on port ${port}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ ${name} is not running on port ${port}: ${error}`);
    return false;
  }
}

/**
 * Test the direct webhook endpoint
 */
async function testDirectWebhook() {
  try {
    const workflowId = 1; // Test workflow ID from the test data
    const nodeId = 'webhook_trigger-1'; // Default webhook trigger node ID
    
    // Test data
    const testPayload = {
      message: 'Test direct webhook',
      timestamp: new Date().toISOString(),
      testId: `direct-test-${Date.now()}`
    };
    
    console.log('\n=== Testing Direct Webhook ===');
    console.log(`Target: Workflow ${workflowId}, Node ${nodeId}`);
    console.log('Payload:', testPayload);
    
    // First, let's check the available webhooks documentation
    console.log('\nChecking webhook documentation...');
    const docsResponse = await fetch('http://localhost:3001/api/webhooks');
    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      console.log('Webhook documentation:', docsData);
    } else {
      console.log(`Documentation endpoint returned status: ${docsResponse.status}`);
    }
    
    // Check workflows in the system
    console.log('\nChecking available workflows...');
    const workflowsResponse = await fetch('http://localhost:5000/api/workflows');
    if (workflowsResponse.ok) {
      const workflows = await workflowsResponse.json();
      console.log(`Found ${workflows.length} workflows:`);
      workflows.forEach((wf: any) => {
        console.log(`- ID: ${wf.id}, Name: ${wf.name}`);
      });
    } else {
      console.log(`Workflows endpoint returned status: ${workflowsResponse.status}`);
    }
    
    // Send the webhook directly to the integration engine
    console.log('\nSending webhook directly to integration engine...');
    const directResponse = await fetch(`http://localhost:3001/webhooks/workflow/${workflowId}/node/${nodeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`Response status: ${directResponse.status}`);
    
    const responseText = await directResponse.text();
    console.log('Raw response:', responseText);
    
    if (responseText) {
      try {
        const responseData = JSON.parse(responseText);
        console.log('Parsed response data:', responseData);
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    }
    
    console.log('\n✓ Direct webhook test completed');
  } catch (error) {
    console.error('\n✗ Error in direct webhook test:', error);
  }
}

/**
 * Test the legacy redirect endpoint
 */
async function testLegacyRedirect() {
  try {
    const workflowId = 1; // Test workflow ID from the test data
    const nodeId = 'webhook_trigger-1'; // Default webhook trigger node ID
    
    // Test data
    const testPayload = {
      message: 'Test legacy webhook redirect',
      timestamp: new Date().toISOString(),
      testId: `legacy-test-${Date.now()}`
    };
    
    console.log('\n=== Testing Legacy Webhook Redirect ===');
    console.log(`Target: Workflow ${workflowId}, Node ${nodeId}`);
    console.log('Payload:', testPayload);
    
    // Check documentation first
    console.log('\nChecking webhook documentation at main server...');
    const mainDocsResponse = await fetch('http://localhost:5000/api/webhooks');
    if (mainDocsResponse.ok) {
      const mainDocsData = await mainDocsResponse.json();
      console.log('Main server webhook documentation:', mainDocsData);
    } else {
      console.log(`Main documentation endpoint returned status: ${mainDocsResponse.status}`);
    }
    
    // Send the webhook to the main server which should redirect to integration engine
    console.log('\nSending webhook to main server...');
    const legacyResponse = await fetch(`http://localhost:5000/api/webhooks/workflow/${workflowId}/node/${nodeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
      redirect: 'follow' // Allow redirects
    });
    
    console.log(`Response status: ${legacyResponse.status}`);
    
    const responseText = await legacyResponse.text();
    console.log('Raw response:', responseText);
    
    if (responseText) {
      try {
        const responseData = JSON.parse(responseText);
        console.log('Parsed response data:', responseData);
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    }
    
    console.log('\n✓ Legacy webhook redirect test completed');
  } catch (error) {
    console.error('\n✗ Error in legacy webhook redirect test:', error);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('=== WEBHOOK DIRECT ACCESS TEST SUITE ===');
  console.log('Testing the new webhook implementation with direct integration engine access');
  console.log('Testing server availability...');
  
  // Check if servers are running
  const mainServerRunning = await checkServer(5000, 'Main Server');
  const integrationEngineRunning = await checkServer(3001, 'Integration Engine');
  const workflowExecutionRunning = await checkServer(3002, 'Workflow Execution Server');
  
  if (!mainServerRunning || !integrationEngineRunning || !workflowExecutionRunning) {
    console.error('\n✗ One or more servers are not running. Please start them before testing.');
    return;
  }
  
  // Run the tests
  await testDirectWebhook();
  await testLegacyRedirect();
  
  console.log('\n=== TEST SUITE COMPLETE ===');
}

// Run the tests
runTests().catch(console.error);