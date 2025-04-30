/**
 * Test script for direct Workflow Execution Server webhook handling
 * 
 * This script tests the direct webhook handling capabilities of the new
 * architecture where the Workflow Execution Server receives and responds
 * to webhook requests directly.
 */
import fetch from 'node-fetch';

async function testWorkflowWebhookExecution() {
  console.log('Testing direct Workflow Execution Server webhook handling...');
  
  try {
    // Create test data for the webhook
    const searchQuery = {
      query: "example company",
      searchId: `test-${Date.now()}`
    };
    
    // Try calling the webhook through the main application server
    // This will forward to the Workflow Execution Server
    console.log('Sending webhook request to main application server...');
    console.log('This should be forwarded to the Workflow Execution Server');
    
    const webhookUrl = 'http://localhost:5000/api/webhooks/workflow/1/node/webhook-trigger-1';
    
    const startTime = Date.now();
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });
    
    const responseTime = Date.now() - startTime;
    const result = await response.json() as Record<string, any>;
    
    console.log(`Webhook response received in ${responseTime}ms`);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    // Check if the response came back as expected
    if (response.status === 200 && result.success) {
      console.log('\n✅ TEST PASSED: Successfully received response from the webhook');
    } else {
      console.log('\n❌ TEST FAILED: Did not receive the expected response');
    }
    
    // Also test the webhook stats endpoint to see pending webhooks
    console.log('\nChecking webhook stats on the Workflow Execution Server...');
    
    const statsResponse = await fetch('http://localhost:3002/api/webhook-stats');
    const statsResult = await statsResponse.json();
    
    console.log('Webhook stats:', statsResult);
    
  } catch (error) {
    console.error('Error in webhook test:', error);
  }
}

// Export the test function as default export
export default testWorkflowWebhookExecution;