/**
 * Improved Send to Webhook Node Implementation
 * 
 * This version ensures that the response sent to 5 Ducks
 * exactly matches their expected format.
 */

async function execute(nodeData, inputData, context) {
  // Log input for debugging
  console.log("Send to Webhook input data:", JSON.stringify(inputData, null, 2));
  console.log("Node settings:", JSON.stringify(nodeData.settings, null, 2));
  
  // Extract URL from settings or input data
  let url = nodeData.settings?.url;
  
  // If URL not found in settings, try to get it from the input data
  if (!url && inputData?.callbackUrl) {
    url = inputData.callbackUrl;
    console.log(`Using callbackUrl from input data: ${url}`);
  }
  
  if (!url) {
    throw new Error("No URL specified in node settings or input data");
  }
  
  // Parse HTTP method from settings
  const method = nodeData.settings?.method || 'POST';
  
  // Parse headers from settings
  let headers = {
    'Content-Type': 'application/json'
  };
  
  try {
    if (nodeData.settings?.headers) {
      const parsedHeaders = JSON.parse(nodeData.settings.headers);
      headers = { ...headers, ...parsedHeaders };
    }
  } catch (error) {
    console.warn("Failed to parse headers, using defaults:", error);
  }
  
  // Critical part: Extract required fields for 5 Ducks response
  let searchId, status, companies, contacts;
  
  // Extract searchId
  if (inputData.searchId) {
    searchId = inputData.searchId;
  } else if (inputData.metadata?.searchId) {
    searchId = inputData.metadata.searchId;
  } else if (inputData.body?.searchId) {
    searchId = inputData.body.searchId;
  }
  
  if (!searchId) {
    console.error("Missing searchId in input data");
    throw new Error("Missing searchId in input data");
  }
  
  // Extract status or default to "completed"
  status = inputData.status || "completed";
  
  // Extract results
  if (inputData.results?.companies) {
    companies = inputData.results.companies;
  } else if (inputData.companies) {
    companies = inputData.companies;
  } else {
    companies = [];
  }
  
  if (inputData.results?.contacts) {
    contacts = inputData.results.contacts;
  } else if (inputData.contacts) {
    contacts = inputData.contacts;
  } else {
    contacts = [];
  }
  
  // Create a properly formatted payload for 5 Ducks
  const payload = {
    searchId: searchId,
    status: status,
    results: {
      companies: companies,
      contacts: contacts
    }
  };
  
  console.log(`Sending webhook to ${url} with payload:`, JSON.stringify(payload, null, 2));
  
  try {
    // Send the HTTP request to the webhook URL
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse the response as JSON
    const responseData = await response.json();
    
    console.log("Webhook response:", JSON.stringify(responseData, null, 2));
    
    // Return the response data
    return {
      output: responseData,
      // Include searchId in the output for confirmation
      searchId: searchId,
      status: status
    };
  } catch (error) {
    console.error("Error sending webhook:", error);
    throw error;
  }
}