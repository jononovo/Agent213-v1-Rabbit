/**
 * Test script for sending data directly to our workflow webhook
 */
import fetch from 'node-fetch';

async function testDirectWebhook() {
  // This is the direct webhook URL for our workflow
  const webhookUrl = "https://b6a08856-bec8-4b81-94b9-606d33b78fd2-00-1h6bieaom2jnj.worf.replit.dev:3001/webhooks/workflow/18/node/webhook_trigger-1746100017094";
  
  // This simulates what 5 Ducks would send us
  const requestData = {
    query: "international transport in seattle",
    searchId: "test_" + Date.now(),
    callbackUrl: "https://b583ab2d-d622-4068-baa1-f0925606ed0a-00-1jadsml3yljop.riker.replit.dev/api/webhooks/search-results",
    userId: 1,
    strategyId: null,
    provider: "custom"
  };

  console.log(`Sending test request to ${webhookUrl}...`);
  console.log(`Request data:`, JSON.stringify(requestData, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log(`Response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`Response body: ${responseText}`);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

// Run the test
testDirectWebhook();