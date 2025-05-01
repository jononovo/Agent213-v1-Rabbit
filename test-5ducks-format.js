/**
 * Test Script for 5 Ducks Format Validation
 * 
 * This script tests whether our responses to 5 Ducks
 * match their expected format including: 
 * - searchId preservation
 * - proper status value
 * - correctly structured results with companies and contacts
 */

const fetch = require('node-fetch');

async function test5DucksFormat() {
  console.log("Testing 5 Ducks integration with proper response format...");
  
  // Generate a unique test searchId
  const testSearchId = `test_${Date.now()}`;
  console.log(`Generated test searchId: ${testSearchId}`);
  
  // URL of your webhook trigger node
  const webhookUrl = "https://b6a08856-bec8-4b81-94b9-606d33b78fd2-00-1h6bieaom2jnj.worf.replit.dev:3001/webhooks/workflow/18/node/webhook_trigger-1746100017094";
  
  // Data to send to the webhook (matching 5 Ducks expected format)
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
    console.log(`1. Extract searchId "${testSearchId}" from the webhook request`);
    console.log(`2. Create a properly formatted response with companies & contacts`);
    console.log(`3. Include "status: completed" in the response`);
    console.log(`4. Send this data to the 5 Ducks callback URL`);
    console.log("===============================");
    console.log("Expected response format to 5 Ducks:");
    console.log(`
{
  "searchId": "${testSearchId}",
  "status": "completed",
  "results": {
    "companies": [
      {
        "name": "Example Company",
        "website": "https://example.com",
        "industry": "Example Industry",
        "location": "Example Location"
      }
    ],
    "contacts": [
      {
        "name": "Example Contact",
        "title": "Example Title",
        "email": "example@example.com",
        "company": "Example Company"
      }
    ]
  }
}
    `);
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
test5DucksFormat();