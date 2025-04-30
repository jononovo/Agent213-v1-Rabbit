/**
 * Test script for direct webhook functionality in Integration Engine
 * 
 * This script tests sending webhooks directly to the Integration Engine without
 * going through the main application server.
 */

import fetch from 'node-fetch';

/**
 * Test direct webhook functionality
 */
async function testDirectWebhook() {
  try {
    console.log('Testing direct webhook functionality with Integration Engine...');
    
    // Target a test workflow
    const workflowId = 1; // Use the webhook test workflow ID
    const nodeId = 'webhook_trigger-1'; // Default webhook trigger node ID
    
    // Test data
    const testData = {
      message: 'Test direct webhook message',
      timestamp: new Date().toISOString(),
      testId: `test-direct-${Date.now()}`
    };
    
    // Send directly to integration engine
    console.log('Sending direct webhook to integration engine...');
    const response = await fetch(`http://localhost:3001/webhooks/workflow/${workflowId}/node/${nodeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`Response status: ${response.status}`);
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    console.log('Direct webhook test complete!');
  } catch (error) {
    console.error('Error testing direct webhook:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  testDirectWebhook().catch(console.error);
}

export { testDirectWebhook };