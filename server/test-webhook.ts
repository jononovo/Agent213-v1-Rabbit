/**
 * Test script for webhook callbacks to Lead Gen Rabbit
 */
import { sendWebhookCallback, sendLeadGenProgressUpdate, sendLeadGenFinalResult } from './services/webhookService';

async function testWebhookCallback() {
  console.log('Testing webhook callback to Lead Gen Rabbit...');
  
  const callbackUrl = 'https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1';
  const headers = {
    'Authorization': 'Bearer LGR-API-ff82c91d7184d5eeb3f3a142',
    'Content-Type': 'application/json'
  };
  
  // Test data for progress update (35%)
  const progressData = {
    searchId: `test-${Date.now()}`,
    status: "in_progress",
    stage: "COMPANY_OVERVIEW",
    progress: 35,
    results: {
      companies: [
        {
          name: "Test Company 1",
          website: "https://testcompany1.com",
          industry: "Technology",
          score: 85
        }
      ],
      metadata: {
        moduleType: "COMPANY_OVERVIEW",
        completedSearches: ["initial"],
        validationScores: {
          companyScore: 85
        }
      }
    }
  };
  
  // Test data for final result (100%)
  const finalData = {
    searchId: `test-${Date.now()}`,
    results: {
      companies: [
        {
          name: "Test Company 1",
          website: "https://testcompany1.com",
          industry: "Technology",
          score: 85
        },
        {
          name: "Test Company 2",
          website: "https://testcompany2.com",
          industry: "Finance",
          score: 92
        }
      ],
      contacts: [
        {
          name: "John Smith",
          title: "CEO",
          email: "john@testcompany1.com",
          company: "Test Company 1"
        }
      ]
    }
  };
  
  try {
    // Test 1: Generic webhook callback
    console.log('\n1. Testing generic webhook callback:');
    const genericResult = await sendWebhookCallback(callbackUrl, 
      {
        ...progressData,
        timestamp: new Date().toISOString()
      }, 
      {
        headers,
        timeout: 30000,
        logPrefix: 'GenericWebhookTest'
      }
    );
    console.log('Generic webhook result:', genericResult);
    
    // Test 2: Progress update (35%)
    console.log('\n2. Testing progress update (35%):');
    const progressResult = await sendLeadGenProgressUpdate(callbackUrl, progressData);
    console.log('Progress update result:', progressResult);
    
    // Test 3: Final result (100%)
    console.log('\n3. Testing final result (100%):');
    const finalResult = await sendLeadGenFinalResult(callbackUrl, finalData);
    console.log('Final result webhook result:', finalResult);
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testWebhookCallback();