/**
 * Test script for sending just the final 100% completion webhook to Bear
 */
import { sendWebhookCallback } from './services/webhookService';

async function testFinalWebhookToBear() {
  console.log('Sending final 100% completion webhook to Bear...');
  
  // Update this to your Bear API endpoint
  const callbackUrl = 'https://Bear-App.replit.app/api/external-workflow/webhook';
  const headers = {
    'Content-Type': 'application/json',
    'X-LGR-Search-ID': 'pittsburgh-manufacturing-search',
    'X-LGR-Webhook-Type': 'search_complete',
    'User-Agent': 'Lead-Gen-Rabbit/1.0'
  };
  
  // Use the same searchId from the previous test
  const searchId = `pittsburgh-manufacturing-${Date.now()}`;
  console.log(`Using searchId: ${searchId}`);
  
  // Final completion data for mid-sized manufacturing companies in Pittsburgh
  const finalData = {
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
    console.log('Sending 100% final result:');
    console.log(JSON.stringify(finalData, null, 2));
    
    const finalResult = await sendWebhookCallback(callbackUrl, finalData, {
      headers,
      timeout: 30000,
      logPrefix: 'BearFinalTest'
    });
    
    console.log('100% final result response:', finalResult);
    
    if (finalResult.success) {
      console.log('SUCCESS: Final webhook delivered successfully!');
    } else {
      console.error('ERROR: Final webhook delivery failed:', finalResult.message);
    }
    
    // Keep the server alive for 1 minute to ensure webhook is delivered
    console.log(`\nKeeping server alive for 1 minute until ${new Date(Date.now() + 1 * 60 * 1000).toLocaleTimeString()}`);
    await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000));
    console.log('Server keep-alive period complete.');
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testFinalWebhookToBear();