/**
 * Final Test Script for 5 Ducks Integration
 * 
 * This script tests our final implementation where:
 * 1. The function node extracts searchId and creates a properly formatted response
 * 2. The send_to_webhook node passes that data along without reformatting
 */

import fetch from 'node-fetch';

async function testFinal5DucksIntegration() {
  console.log("Testing final 5 Ducks integration with proper response format...");
  
  // Generate a unique test searchId
  const testSearchId = `test_${Date.now()}`;
  console.log(`Generated test searchId: ${testSearchId}`);
  
  // URL of your webhook trigger node
  const webhookUrl = "https://b6a08856-bec8-4b81-94b9-606d33b78fd2-00-1h6bieaom2jnj.worf.replit.dev:3001/webhooks/workflow/18/node/webhook_trigger-1746100017094";
  
  // Data to send to the webhook (matching 5 Ducks format)
  const requestData = {
    query: "international shipping companies in seattle",
    searchId: testSearchId,
    callbackUrl: "https://b583ab2d-d622-4068-baa1-f0925606ed0a-00-1jadsml3yljop.riker.replit.dev/api/webhooks/search-results",
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
    console.log("Test completed! The workflow should now:");
    console.log(`1. Function node extracts searchId "${testSearchId}" from webhook`);
    console.log(`2. Function node creates a properly formatted response with companies & contacts`);
    console.log(`3. Send_to_webhook node passes this data to 5 Ducks without reformatting`);
    console.log("===============================");
    console.log("Expected response to 5 Ducks:");
    console.log(`
{
  "searchId": "${testSearchId}",
  "status": "completed",
  "results": {
    "companies": [...],
    "contacts": [...]
  }
}
    `);
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
testFinal5DucksIntegration();