/**
 * Test script for webhook callbacks to Bear
 * 
 * This script sends test webhook callbacks to the Bear endpoint
 * for the "mid-sized manufacturing companies in Pittsburgh" search
 */
import { sendWebhookCallback, sendLeadGenProgressUpdate, sendLeadGenFinalResult } from './services/webhookService';

async function testPittsburghManufacturingSearch() {
  console.log('Testing "mid-sized manufacturing companies in Pittsburgh" search webhook callback to Bear...');
  
  // Update this to your Bear API endpoint
  const callbackUrl = 'https://Bear-App.replit.app/api/external-workflow/webhook';
  const headers = {
    'Content-Type': 'application/json',
    'X-LGR-Search-ID': 'pittsburgh-manufacturing-search',
    'X-LGR-Webhook-Type': 'search_progress',
    'User-Agent': 'Lead-Gen-Rabbit/1.0'
  };
  
  // Create a unique search ID for this test
  const searchId = `pittsburgh-manufacturing-${Date.now()}`;
  console.log(`Using searchId: ${searchId}`);
  
  // Step 1: Send 10% progress update
  const data10pct = {
    searchId,
    status: "in_progress",
    stage: "COMPANY_SEARCH_INITIAL",
    progress: 10,
    timestamp: new Date().toISOString(),
    results: {
      companies: [],
      metadata: {
        moduleType: "COMPANY_SEARCH",
        completedSearches: [],
        message: "Starting search for mid-sized manufacturing companies in Pittsburgh..."
      }
    }
  };
  
  // Step 2: Send 35% progress update
  const data35pct = {
    searchId,
    status: "in_progress",
    stage: "COMPANY_SEARCH_PROCESSING",
    progress: 35,
    timestamp: new Date().toISOString(),
    results: {
      companies: [
        {
          name: "Pittsburgh Precision Manufacturing",
          website: "https://pittsburghprecision.com",
          industry: "Manufacturing",
          score: 85,
          description: "Mid-sized precision manufacturing company based in Pittsburgh"
        }
      ],
      metadata: {
        moduleType: "COMPANY_SEARCH",
        completedSearches: ["initial"],
        message: "Initial company matches found for manufacturing in Pittsburgh."
      }
    }
  };
  
  // Step 3: Send 70% progress update
  const data70pct = {
    searchId,
    status: "in_progress",
    stage: "COMPANY_SEARCH_REFINING",
    progress: 70,
    timestamp: new Date().toISOString(),
    results: {
      companies: [
        {
          name: "Pittsburgh Precision Manufacturing",
          website: "https://pittsburghprecision.com",
          industry: "Manufacturing",
          score: 92,
          description: "Mid-sized precision manufacturing company based in Pittsburgh",
          location: "Pittsburgh, PA",
          employeeCount: "50-100",
          yearFounded: 2005
        },
        {
          name: "Steel City Fabricators",
          website: "https://steelcityfab.com",
          industry: "Manufacturing",
          score: 88,
          description: "Mid-sized metal fabrication company specializing in steel components",
          location: "Pittsburgh, PA",
          employeeCount: "100-250",
          yearFounded: 1998
        },
        {
          name: "Allegheny Industrial Solutions",
          website: "https://alleghenysolutions.com",
          industry: "Manufacturing",
          score: 75,
          description: "Industrial equipment manufacturer serving the Pittsburgh area",
          location: "Pittsburgh, PA",
          employeeCount: "50-150",
          yearFounded: 2010
        }
      ],
      metadata: {
        moduleType: "COMPANY_SEARCH",
        completedSearches: ["initial", "refinement"],
        message: "Refining company matches for mid-sized manufacturing in Pittsburgh."
      }
    }
  };
  
  // Step 4: Send 100% completed result
  const data100pct = {
    searchId,
    status: "completed",
    progress: 100,
    timestamp: new Date().toISOString(),
    results: {
      companies: [
        {
          name: "Pittsburgh Precision Manufacturing",
          website: "https://pittsburghprecision.com",
          industry: "Manufacturing",
          location: "Pittsburgh, PA",
          description: "Mid-sized precision manufacturing company specializing in metal components",
          employeeCount: 87,
          foundedYear: 2005,
          revenue: "$10M-$50M",
          headquarters: "Pittsburgh, PA"
        },
        {
          name: "Steel City Fabricators",
          website: "https://steelcityfab.com",
          industry: "Manufacturing",
          location: "Pittsburgh, PA",
          description: "Metal fabrication company specializing in steel components",
          employeeCount: 142,
          foundedYear: 1998,
          revenue: "$25M-$75M",
          headquarters: "Pittsburgh, PA"
        },
        {
          name: "Allegheny Industrial Solutions",
          website: "https://alleghenysolutions.com",
          industry: "Manufacturing",
          location: "Pittsburgh, PA",
          description: "Industrial equipment manufacturer serving the Pittsburgh region",
          employeeCount: 76,
          foundedYear: 2010,
          revenue: "$5M-$20M",
          headquarters: "Pittsburgh, PA"
        },
        {
          name: "Three Rivers Manufacturing",
          website: "https://threeriversmfg.com",
          industry: "Manufacturing",
          location: "Pittsburgh, PA",
          description: "Custom manufacturing solutions for industrial applications",
          employeeCount: 118,
          foundedYear: 2008,
          revenue: "$15M-$40M",
          headquarters: "Pittsburgh, PA"
        },
        {
          name: "Keystone Precision Products",
          website: "https://keystoneprecision.com",
          industry: "Manufacturing",
          location: "Pittsburgh, PA",
          description: "High-precision manufacturing for aerospace and medical industries",
          employeeCount: 95,
          foundedYear: 2001,
          revenue: "$10M-$50M",
          headquarters: "Pittsburgh, PA"
        }
      ],
      metadata: {
        moduleType: "COMPANY_OVERVIEW",
        validationScores: {
          companyScore: 90
        }
      }
    }
  };
  
  try {
    // Message to Bear
    console.log('\nSending initial message to Bear:');
    const messageResult = await sendWebhookCallback(callbackUrl, {
      searchId,
      status: "message",
      message: "This is a test for the 'mid-sized manufacturing companies in Pittsburgh' search. We'll be sending sequential updates with progress at 10%, 35%, 70%, and 100% completion states.",
      timestamp: new Date().toISOString()
    }, {
      headers,
      timeout: 30000,
      logPrefix: 'BearMessage'
    });
    console.log('Message result:', messageResult);
    
    // Wait 2 seconds between callbacks
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 10% progress update
    console.log('\nSending 10% progress update:');
    const result10pct = await sendWebhookCallback(callbackUrl, data10pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear10Pct'
    });
    console.log('10% progress result:', result10pct);
    
    // Wait 2 seconds
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 35% progress update
    console.log('\nSending 35% progress update:');
    const result35pct = await sendWebhookCallback(callbackUrl, data35pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear35Pct'
    });
    console.log('35% progress result:', result35pct);
    
    // Wait 2 seconds
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 70% progress update
    console.log('\nSending 70% progress update:');
    const result70pct = await sendWebhookCallback(callbackUrl, data70pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear70Pct'
    });
    console.log('70% progress result:', result70pct);
    
    // Wait 2 seconds
    console.log('\nWaiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 100% final result
    console.log('\nSending 100% final result:');
    const result100pct = await sendWebhookCallback(callbackUrl, data100pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear100Pct'
    });
    console.log('100% final result:', result100pct);
    
    console.log('\nPittsburgh manufacturing search test complete! All updates sent to Bear.');
    console.log('Keep this terminal running for 10 minutes to ensure webhook delivery.');
    
    // Keep the server alive for 10 minutes to ensure all webhooks are delivered
    console.log(`\nKeeping server alive for 10 minutes until ${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString()}`);
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
    console.log('Server keep-alive period complete.');
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testPittsburghManufacturingSearch();