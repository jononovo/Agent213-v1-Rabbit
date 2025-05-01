/**
 * Improved 5 Ducks Function Node Implementation
 * 
 * This function properly extracts and preserves the searchId from incoming webhook data,
 * ensuring it's passed through the entire workflow and returned to the callback URL.
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
  const mockResults = {
    companies: [
      {
        name: "Global Logistics Seattle",
        website: "https://globallogisticsseattle.com",
        industry: "Transportation & Logistics",
        location: "Seattle, WA",
        size: "50-200 employees",
        founded: 2005,
        contacts: [
          {
            name: "Sarah Johnson",
            title: "Operations Director",
            email: "sarah.johnson@globallogisticsseattle.com",
            phone: "+1 (206) 555-1234"
          }
        ]
      },
      {
        name: "PacWest Transport Solutions",
        website: "https://pacwesttransport.com",
        industry: "Freight & Shipping",
        location: "Seattle, WA",
        size: "100-500 employees",
        founded: 1998,
        contacts: [
          {
            name: "Michael Chen",
            title: "CEO",
            email: "m.chen@pacwesttransport.com",
            phone: "+1 (206) 555-5678"
          }
        ]
      }
    ]
  };
  
  // The critical part: include searchId in the output
  // This ensures it flows through to the next node
  const output = {
    results: mockResults,
    metadata: {
      searchId: searchId,  // Preserve the searchId
      query: query,
      timestamp: new Date().toISOString()
    },
    // Also include direct top-level searchId to ensure it's accessible
    // in case the node receiving this data expects it there
    searchId: searchId,
    // Include callbackUrl if available
    callbackUrl: callbackUrl || null
  };
  
  console.log("Function node output:", JSON.stringify(output, null, 2));
  return output;
}