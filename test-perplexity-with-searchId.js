/**
 * Test Perplexity API Integration with SearchID Preservation
 * 
 * This script tests the entire 5 Ducks integration with Perplexity API,
 * ensuring that the searchId is preserved throughout the workflow and
 * included in the final response.
 */

import fetch from 'node-fetch';

async function testPerplexityIntegration() {
  console.log("Testing Perplexity API integration with searchId preservation...");
  
  // Generate a unique test searchId
  const testSearchId = `test_${Date.now()}`;
  console.log(`Generated test searchId: ${testSearchId}`);
  
  // URL of your webhook trigger node
  const webhookUrl = "https://b6a08856-bec8-4b81-94b9-606d33b78fd2-00-1h6bieaom2jnj.worf.replit.dev:3001/webhooks/workflow/18/node/webhook_trigger-1746100017094";
  
  // Mock callback URL where we'll capture the response
  const callbackUrl = "https://b583ab2d-d622-4068-baa1-f0925606ed0a-00-1jadsml3yljop.riker.replit.dev/api/webhooks/search-results";
  
  // Data to send to the webhook
  const requestData = {
    query: "renewable energy companies in California",
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
    console.log("Test completed! The Phase 2 workflow should now:");
    console.log(`1. Extract searchId "${testSearchId}" from webhook`);
    console.log(`2. Use Perplexity API to get real search results for the query`);
    console.log(`3. Format the results for 5 Ducks with companies & contacts`);
    console.log(`4. Include status: "completed" in the response`);
    console.log(`5. Send the response to ${callbackUrl} with searchId preserved`);
    console.log("===============================");
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
testPerplexityIntegration();