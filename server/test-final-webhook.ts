/**
 * Test script for sending just the final 100% completion webhook to Lead Gen Rabbit
 */
import { sendWebhookCallback } from './services/webhookService';

async function testFinalWebhook() {
  console.log('Sending final 100% completion webhook to Lead Gen Rabbit...');
  
  const callbackUrl = 'https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1';
  const headers = {
    'Authorization': 'Bearer LGR-API-ff82c91d7184d5eeb3f3a142',
    'Content-Type': 'application/json'
  };
  
  // Create a unique search ID for this test
  const searchId = `final-test-${Date.now()}`;
  console.log(`Using searchId: ${searchId}`);
  
  // Final completion data - using exact format specified by Lead Gen Rabbit
  const finalData = {
    searchId,
    status: "completed",
    progress: 100,
    results: {
      companies: [
        {
          name: "Example Tech Inc",
          website: "https://exampletech.com",
          industry: "Technology",
          location: "San Francisco, CA",
          description: "A technology company specializing in software development",
          employeeCount: 75,
          foundedYear: 2015,
          revenue: "$10M-$50M",
          headquarters: "San Francisco, CA"
        },
        {
          name: "Sample Solutions LLC",
          website: "https://samplesolutions.com",
          industry: "Business Services",
          location: "Chicago, IL",
          description: "Business solutions provider focusing on digital transformation",
          employeeCount: 32,
          foundedYear: 2018,
          revenue: "$1M-$10M",
          headquarters: "Chicago, IL"
        }
      ],
      metadata: {
        moduleType: "COMPANY_OVERVIEW",
        validationScores: {
          companyScore: 85
        }
      }
    }
  };
  
  try {
    console.log('Sending 100% final result:');
    console.log(JSON.stringify(finalData, null, 2));
    
    const finalResult = await sendWebhookCallback(callbackUrl, finalData, {
      headers,
      timeout: 30000,
      logPrefix: 'LeadGenFinalTest'
    });
    
    console.log('100% final result response:', finalResult);
    
    if (finalResult.success) {
      console.log('SUCCESS: Final webhook delivered successfully!');
    } else {
      console.error('ERROR: Final webhook delivery failed:', finalResult.message);
    }
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testFinalWebhook();