/**
 * Improved Send to Webhook Node Implementation
 * 
 * This version ensures that the searchId is properly preserved
 * and included in the payload sent to the external webhook URL.
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
  
  // Critical part: Extract and preserve searchId
  let searchId;
  
  // Check for searchId in different possible locations
  if (inputData.searchId) {
    searchId = inputData.searchId;
  } else if (inputData.metadata?.searchId) {
    searchId = inputData.metadata.searchId;
  } else if (inputData.body?.searchId) {
    searchId = inputData.body.searchId;
  }
  
  console.log(`Extracted searchId for webhook: ${searchId}`);
  
  // Prepare the payload
  let payload;
  
  // If the input is the original webhook data or has nested body
  if (inputData.body && typeof inputData.body === 'object') {
    // Check if we have results from previous processing
    if (inputData.results) {
      payload = {
        searchId: searchId,
        results: inputData.results
      };
    } else {
      // Simple pass-through of the body
      payload = { ...inputData.body };
      // Make sure searchId is included
      if (searchId && !payload.searchId) {
        payload.searchId = searchId;
      }
    }
  } else if (inputData.results) {
    // Format based on expected 5 Ducks format
    payload = {
      searchId: searchId,
      results: inputData.results
    };
  } else {
    // Simple pass-through of input data
    payload = { ...inputData };
    // Make sure searchId is included
    if (searchId && !payload.searchId) {
      payload.searchId = searchId;
    }
  }
  
  console.log(`Sending webhook with payload:`, JSON.stringify(payload, null, 2));
  
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
      searchId: searchId
    };
  } catch (error) {
    console.error("Error sending webhook:", error);
    throw error;
  }
}