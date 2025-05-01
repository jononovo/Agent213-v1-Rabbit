/**
 * Test Perplexity API Integration
 * 
 * This script tests the Perplexity API for searching companies and contacts.
 * It will be the foundation for our real-time search in the 5 Ducks integration.
 */

import fetch from 'node-fetch';

async function testPerplexitySearch(query, context = '', maxResults = 5) {
  try {
    console.log(`Testing Perplexity search for: "${query}"`);
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    
    // Construct the search prompt for company and contact information
    const searchPrompt = `
      I need information about companies and their key contacts.
      
      Search query: "${query}"
      
      ${context ? `Additional context: ${context}` : ''}
      
      Please find the top ${maxResults} most relevant companies, with these details for each:
      - Company name
      - Website URL
      - Industry sector
      - Location (city and state/country)
      - Company size (approximate employee count)
      - Year founded (if available)
      
      For each company, provide key contact information for 1-3 decision makers:
      - Full name
      - Job title
      - Email address (if available, or use a standard format like firstname.lastname@domain.com)
      - Phone number (if available)
      - LinkedIn profile URL (if available)
      
      Format your answer as structured data only, no introductions or explanations.
    `;
    
    // Make API request to Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that specializes in finding accurate information about companies and business contacts. Provide specific details and structured data about companies and their executives based on search queries.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        search_recency_filter: 'month',
        search_domain_filter: ['linkedin.com', 'crunchbase.com', 'bloomberg.com', 'dnb.com', 'forbes.com', 'inc.com'],
        stream: false
      })
    });
    
    const responseData = await response.json();
    console.log('Raw Perplexity API response:');
    console.log(JSON.stringify(responseData, null, 2));

    // Process the Perplexity response to extract structured data
    // This is a simplified extraction - real implementation will parse the data
    const assistantMessage = responseData.choices?.[0]?.message?.content || '';
    console.log('\nPerplexity response content:');
    console.log(assistantMessage);

    // Here we'd extract the actual company and contact details
    // For now just showing the raw response for debugging

    return {
      success: true,
      rawResponse: responseData,
      content: assistantMessage,
      citations: responseData.citations || []
    };
  } catch (error) {
    console.error('Error querying Perplexity API:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

async function main() {
  // Generate the searchId to simulate a real 5 Ducks request
  const searchId = `test_${Date.now()}`;
  
  // Simulate a query from 5 Ducks
  const result = await testPerplexitySearch('software companies in Seattle');
  
  console.log('\n----- RESULTS SUMMARY -----');
  if (result.success) {
    console.log('✅ Perplexity API search completed successfully');
    console.log(`Citations: ${result.citations.length || 0}`);
  } else {
    console.log('❌ Perplexity API search failed');
    console.log(`Error: ${result.error}`);
  }
}

// Run the test
main().catch(console.error);