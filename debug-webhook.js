/**
 * Debug Webhook Test
 * This script tests the webhook flow and prints the response details
 */

import fetch from 'node-fetch';

async function testWebhook() {
  console.log("Starting webhook test...");
  
  const webhookUrl = "https://b6a08856-bec8-4b81-94b9-606d33b78fd2-00-1h6bieaom2jnj.worf.replit.dev:3001/webhooks/workflow/18/node/webhook_trigger-1746100017094";
  
  const testData = {
    query: "international transport in seattle", 
    searchId: "test_debug_webhook", 
    callbackUrl: "https://b583ab2d-d622-4068-baa1-f0925606ed0a-00-1jadsml3yljop.riker.replit.dev/api/webhooks/search-results", 
    userId: 1, 
    strategyId: null, 
    provider: "custom"
  };
  
  try {
    console.log(`Sending POST request to ${webhookUrl}`);
    console.log("Request data:", JSON.stringify(testData, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseData = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log("Response headers:", response.headers);
    console.log("Response body:", JSON.stringify(responseData, null, 2));
    
    console.log("Test completed.");
  } catch (error) {
    console.error("Error during webhook test:", error);
  }
}

// Run the test
testWebhook();