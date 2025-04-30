/**
 * Test script for webhook callbacks to Lead Gen Rabbit
 * 
 * This simplified version only focuses on company search without contacts
 */
import { sendWebhookCallback, sendLeadGenProgressUpdate, sendLeadGenFinalResult } from './services/webhookService';

async function testSimplifiedCompanySearch() {
  console.log('Testing simplified company-only search webhook callback to Lead Gen Rabbit...');
  
  const callbackUrl = 'https://lead-rabbit.replit.app/api/webhooks/workflow/6/node/webhook_trigger-1';
  const headers = {
    'Authorization': 'Bearer LGR-API-ff82c91d7184d5eeb3f3a142',
    'Content-Type': 'application/json'
  };
  
  // Create a unique search ID for this test
  const searchId = `simplified-company-search-${Date.now()}`;
  console.log(`Using searchId: ${searchId}`);
  
  // Step 1: Send 10% progress update
  const data10pct = {
    searchId,
    status: "in_progress",
    stage: "COMPANY_SEARCH_INITIAL",
    progress: 10,
    results: {
      companies: [],
      metadata: {
        moduleType: "COMPANY_SEARCH",
        completedSearches: [],
        message: "Starting company search..."
      }
    }
  };
  
  // Step 2: Send 35% progress update
  const data35pct = {
    searchId,
    status: "in_progress",
    stage: "COMPANY_SEARCH_PROCESSING",
    progress: 35,
    results: {
      companies: [
        {
          name: "Example Tech Inc",
          website: "https://exampletech.com",
          industry: "Technology",
          score: 75,
          description: "A technology company specializing in software development"
        }
      ],
      metadata: {
        moduleType: "COMPANY_SEARCH",
        completedSearches: ["initial"],
        message: "Initial company matches found."
      }
    }
  };
  
  // Step 3: Send 70% progress update
  const data70pct = {
    searchId,
    status: "in_progress",
    stage: "COMPANY_SEARCH_REFINING",
    progress: 70,
    results: {
      companies: [
        {
          name: "Example Tech Inc",
          website: "https://exampletech.com",
          industry: "Technology",
          score: 85,
          description: "A technology company specializing in software development",
          address: "123 Tech Way, San Francisco, CA"
        },
        {
          name: "Sample Solutions LLC",
          website: "https://samplesolutions.com",
          industry: "Business Services",
          score: 78,
          description: "Business solutions provider"
        }
      ],
      metadata: {
        moduleType: "COMPANY_SEARCH",
        completedSearches: ["initial", "refinement"],
        message: "Refining company matches."
      }
    }
  };
  
  // Step 4: Send 100% completed result - using exact format specified by Lead Gen Rabbit
  const data100pct = {
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
        },
        {
          name: "Acme Enterprises",
          website: "https://acme-enterprises.com",
          industry: "Manufacturing",
          location: "Detroit, MI",
          description: "Manufacturing company with global reach",
          employeeCount: 147,
          foundedYear: 2005,
          revenue: "$50M-$100M",
          headquarters: "Detroit, MI"
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
    // Message to Lead Gen Rabbit
    console.log('\nSending message to Lead Gen Rabbit:');
    const messageResult = await sendWebhookCallback(callbackUrl, {
      searchId,
      status: "message",
      message: "This is a test of a simplified company-only search workflow. We'll be sending sequential updates with progress at 10%, 35%, 70%, and 100% completion states. Please monitor these callbacks to help diagnose our webhook integration issue.",
      timestamp: new Date().toISOString()
    }, {
      headers,
      timeout: 30000,
      logPrefix: 'LeadGenMessage'
    });
    console.log('Message result:', messageResult);
    
    // Wait 2 seconds between callbacks
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 10% progress update
    console.log('\nSending 10% progress update:');
    const result10pct = await sendLeadGenProgressUpdate(callbackUrl, data10pct);
    console.log('10% progress result:', result10pct);
    
    // Wait 2 seconds
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 35% progress update
    console.log('\nSending 35% progress update:');
    const result35pct = await sendLeadGenProgressUpdate(callbackUrl, data35pct);
    console.log('35% progress result:', result35pct);
    
    // Wait 2 seconds
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 70% progress update
    console.log('\nSending 70% progress update:');
    const result70pct = await sendLeadGenProgressUpdate(callbackUrl, data70pct);
    console.log('70% progress result:', result70pct);
    
    // Wait 2 seconds
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 100% final result
    console.log('\nSending 100% final result:');
    const result100pct = await sendWebhookCallback(callbackUrl, data100pct, {
      headers,
      timeout: 30000,
      logPrefix: 'LeadGenFinal'
    });
    console.log('100% final result:', result100pct);
    
    console.log('\nSimplified company search test complete! All updates sent to Lead Gen Rabbit.');
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testSimplifiedCompanySearch();