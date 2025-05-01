/**
 * Test script for sending data to 5 Ducks webhook
 */
import fetch from 'node-fetch';

async function test5DucksWebhook() {
  const callbackUrl = "https://b583ab2d-d622-4068-baa1-f0925606ed0a-00-1jadsml3yljop.riker.replit.dev/api/webhooks/search-results";
  
  // Create test response in the expected format
  const responseData = {
    searchId: "direct_test_" + Date.now(),
    status: "completed",
    results: {
      companies: [
        {
          name: "Smith & Associates",
          website: "https://smith-associates-example.com",
          industry: "Legal Services",
          location: "Chicago, IL",
          size: "50-100 employees",
          foundedYear: 2005
        },
        {
          name: "Chicago Legal Partners",
          website: "https://chicago-legal-example.com",
          industry: "Legal Services",
          location: "Chicago, IL",
          size: "100-250 employees",
          foundedYear: 1995
        }
      ],
      contacts: [
        {
          name: "Jane Smith",
          title: "Managing Partner",
          email: "jane.smith@example.com",
          phone: "+1-555-123-4567",
          linkedin: "https://linkedin.com/in/janesmith-example",
          company: "Smith & Associates"
        },
        {
          name: "Robert Johnson",
          title: "Senior Partner",
          email: "rjohnson@example.com",
          phone: "+1-555-987-6543",
          linkedin: "https://linkedin.com/in/rjohnson-example",
          company: "Smith & Associates"
        },
        {
          name: "Maria Rodriguez",
          title: "CEO",
          email: "mrodriguez@example.com",
          phone: "+1-555-234-5678",
          linkedin: "https://linkedin.com/in/mrodriguez-example",
          company: "Chicago Legal Partners"
        }
      ]
    }
  };

  console.log(`Sending test data to ${callbackUrl}...`);
  
  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
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
test5DucksWebhook();