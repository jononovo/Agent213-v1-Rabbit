/**
 * Improved 5 Ducks Function Node Implementation
 * 
 * This function properly extracts the searchId from incoming webhook data,
 * and creates a properly formatted response that matches 5 Ducks' expected format.
 */

function process(input) {
  console.log("Processing 5 Ducks webhook data:", JSON.stringify(input, null, 2));
  
  // Extract data from webhook input
  let searchId, query, callbackUrl;
  
  // Handle different potential input structures
  if (input.body && typeof input.body === 'object') {
    // Extract from body (common webhook trigger format)
    searchId = input.body.searchId;
    query = input.body.query;
    callbackUrl = input.body.callbackUrl;
  } else if (input.searchId) {
    // Direct access if already extracted
    searchId = input.searchId;
    query = input.query;
    callbackUrl = input.callbackUrl;
  } else if (typeof input === 'object') {
    // Try to access directly from input
    searchId = input.searchId;
    query = input.query;
    callbackUrl = input.callbackUrl;
  }
  
  // Validate critical fields
  if (!searchId) {
    console.error("Error: Missing searchId in webhook data");
    throw new Error("Missing searchId in webhook data");
  }
  
  if (!query) {
    console.error("Error: Missing query in webhook data");
    throw new Error("Missing query in webhook data");
  }
  
  console.log(`Extracted searchId: ${searchId}, query: ${query}`);
  
  // For v1: Create mock search results
  // These will be replaced by Perplexity API in v2
  const mockCompanies = [
    {
      name: "Global Logistics Seattle",
      website: "https://globallogisticsseattle.com",
      industry: "Transportation & Logistics",
      location: "Seattle, WA",
      size: "50-200 employees",
      founded: 2005
    },
    {
      name: "PacWest Transport Solutions",
      website: "https://pacwesttransport.com",
      industry: "Freight & Shipping",
      location: "Seattle, WA",
      size: "100-500 employees",
      founded: 1998
    }
  ];
  
  // Add contacts as a separate array in the expected format
  const mockContacts = [
    {
      name: "Sarah Johnson",
      title: "Operations Director",
      email: "sarah.johnson@globallogisticsseattle.com",
      phone: "+1 (206) 555-1234",
      company: "Global Logistics Seattle"
    },
    {
      name: "Michael Chen",
      title: "CEO",
      email: "m.chen@pacwesttransport.com",
      phone: "+1 (206) 555-5678",
      company: "PacWest Transport Solutions"
    }
  ];
  
  // Create a response object that exactly matches 5 Ducks expected format
  const output = {
    // Include searchId as requested (critical!)
    searchId: searchId,
    
    // Add status field with expected value
    status: "completed",
    
    // Format results as expected by 5 Ducks
    results: {
      companies: mockCompanies,
      contacts: mockContacts
    },
    
    // Include metadata for our internal use
    metadata: {
      query: query,
      timestamp: new Date().toISOString(),
      source: "function_node" // Will be replaced with "perplexity_api" in v2
    },
    
    // Include callbackUrl for use by send_to_webhook node
    callbackUrl: callbackUrl
  };
  
  console.log("Function node output:", JSON.stringify(output, null, 2));
  return output;
}