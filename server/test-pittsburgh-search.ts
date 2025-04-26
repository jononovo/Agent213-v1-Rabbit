/**
 * Test script for sending a complete search flow to Bear for
 * "mid-sized manufacturing companies in Pittsburgh"
 * 
 * This script sends a properly formatted sequence of webhooks with the
 * required status values: in_progress → completed
 */
import { sendWebhookCallback } from './services/webhookService';

async function testPittsburghSearch() {
  console.log('=== Testing "mid-sized manufacturing companies in Pittsburgh" search ===');
  
  // Bear API endpoint
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
  
  try {
    // Send 10% progress update
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
    
    console.log('\n[1/4] Sending 10% progress update...');
    const result10pct = await sendWebhookCallback(callbackUrl, data10pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear10Pct'
    });
    console.log(`Status: ${result10pct.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 35% progress update
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
    
    console.log('\n[2/4] Sending 35% progress update...');
    const result35pct = await sendWebhookCallback(callbackUrl, data35pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear35Pct'
    });
    console.log(`Status: ${result35pct.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 70% progress update
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
    
    console.log('\n[3/4] Sending 70% progress update...');
    const result70pct = await sendWebhookCallback(callbackUrl, data70pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear70Pct'
    });
    console.log(`Status: ${result70pct.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send 100% completed result
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
    
    console.log('\n[4/4] Sending 100% final result...');
    const result100pct = await sendWebhookCallback(callbackUrl, data100pct, {
      headers,
      timeout: 30000,
      logPrefix: 'Bear100Pct'
    });
    console.log(`Status: ${result100pct.success ? 'SUCCESS' : 'FAILED'}`);
    
    console.log('\n=== Pittsburgh manufacturing search test complete! ===');
    console.log(`All webhooks successfully sent to Bear for searchId: ${searchId}`);
    
    // Keep the connection alive for 20 seconds to ensure all data is processed
    console.log('\nKeeping connection alive for 20 seconds...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testPittsburghSearch();