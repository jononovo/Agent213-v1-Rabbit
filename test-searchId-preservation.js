/**
 * Test Script for SearchID Preservation
 * 
 * This script tests whether the searchId is properly preserved
 * throughout the workflow and included in the response
 * sent back to the 5 Ducks callback URL.
 */

const fetch = require('node-fetch');

async function testSearchIdPreservation() {
  console.log("Testing searchId preservation in the 5 Ducks integration workflow...");
  
  // Generate a unique test searchId
  const testSearchId = `test_${Date.now()}`;
  console.log(`Generated test searchId: ${testSearchId}`);
  
  // URL of your webhook trigger node
  const webhookUrl = "https://b6a08856-bec8-4b81-94b9-606d33b78fd2-00-1h6bieaom2jnj.worf.replit.dev:3001/webhooks/workflow/18/node/webhook_trigger-1746100017094";
  
  // Mock callback URL where we'll capture the response
  // In a real scenario, this would be the 5 Ducks API
  const callbackUrl = "https://b583ab2d-d622-4068-baa1-f0925606ed0a-00-1jadsml3yljop.riker.replit.dev/api/webhooks/search-results";
  
  // Data to send to the webhook
  const requestData = {
    query: "international shipping companies in seattle",
    searchId: testSearchId,
    callbackUrl: callbackUrl,
    userId: 123,
    strategyId: null,
    provider: "custom"
  };
  
  console.log("Sending request with data:", requestData);
  
  try {
    // Send the webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log("Webhook response received:", responseData);
    
    console.log("===============================");
    console.log("Test completed! The searchId should now be:");
    console.log(`1. Extracted by the function node`);
    console.log(`2. Passed through the entire workflow`);
    console.log(`3. Included in the response sent to the callback URL: ${callbackUrl}`);
    console.log("===============================");
    console.log("To verify this works correctly, check your workflow execution logs and");
    console.log("confirm the Send to Webhook node is including the searchId in its payload.");
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
testSearchIdPreservation();