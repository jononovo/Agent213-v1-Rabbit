/**
 * Function Node Code for 5 Ducks Integration
 * 
 * This function processes incoming webhook data from 5 Ducks,
 * extracts the search query and searchId, and prepares it for
 * the Perplexity API node.
 */

function process(input) {
  // Log the incoming data for debugging
  console.log("Processing 5 Ducks webhook data:", input);
  
  // Extract critical information from the webhook
  let searchId, query, callbackUrl;
  
  // Handle different input structures
  if (input.body) {
    // If input has a body property (common with webhook triggers)
    searchId = input.body.searchId;
    query = input.body.query;
    callbackUrl = input.body.callbackUrl;
  } else {
    // Direct access if already extracted
    searchId = input.searchId;
    query = input.query;
    callbackUrl = input.callbackUrl;
  }
  
  // Validate required fields
  if (!searchId) {
    console.error("Missing searchId in webhook data");
    throw new Error("Missing searchId in webhook data");
  }
  
  if (!query) {
    console.error("Missing query in webhook data");
    throw new Error("Missing query in webhook data");
  }
  
  // Create a proper prompt for the Perplexity API
  const prompt = `
    I need information about companies and their key contacts related to this query:
    "${query}"
    
    Please find the top 5 most relevant companies, with these details for each:
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
  
  // Prepare system prompt for the Perplexity API
  const systemPrompt = "You are a helpful assistant that specializes in finding accurate information about companies and business contacts. Provide specific details and structured data about companies and their executives based on search queries.";
  
  // Store original request metadata
  const metadata = {
    searchId,
    callbackUrl,
    originalQuery: query,
    timestamp: new Date().toISOString()
  };
  
  // Return structured data for the Perplexity API node
  return {
    prompt: prompt,
    system: systemPrompt,
    metadata: metadata
  };
}