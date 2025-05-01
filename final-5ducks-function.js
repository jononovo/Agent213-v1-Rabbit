/**
 * Final 5 Ducks Function Node Implementation
 * 
 * This function extracts the searchId from incoming webhook data
 * and creates a properly formatted response that matches 5 Ducks' expected format.
 * The send_to_webhook node will pass this data along without modifying it.
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
      company: "Global Logistics Seattle"
    },
    {
      name: "Michael Chen",
      title: "CEO",
      email: "m.chen@pacwesttransport.com",
      company: "PacWest Transport Solutions"
    }
  ];
  
  // Create a response object that exactly matches 5 Ducks expected format
  const responsePayload = {
    searchId: searchId,
    status: "completed",
    results: {
      companies: mockCompanies,
      contacts: mockContacts
    }
  };
  
  // This is the data that will be sent to the webhook
  const output = {
    // Include the callbackUrl for the send_to_webhook node to use
    callbackUrl: callbackUrl,
    
    // Include the exact payload that should be sent to 5 Ducks
    // The send_to_webhook node should send this data without modifying it
    payload: responsePayload
  };
  
  console.log("Function node output:", JSON.stringify(output, null, 2));
  return output;
}