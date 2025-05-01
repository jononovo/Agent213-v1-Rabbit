/**
 * Final Send to Webhook Node Implementation
 * 
 * This version simply passes along the payload from the function node
 * without reformatting it, assuming the function node has already
 * created the properly formatted data.
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
  
  // Determine what payload to send
  let payload;
  
  // If the function node has created a properly formatted payload, use that
  if (inputData.payload) {
    payload = inputData.payload;
    console.log("Using pre-formatted payload from input data");
  } 
  // Otherwise, just pass along the input data itself
  else {
    payload = inputData;
    console.log("Using input data as payload");
  }
  
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
      output: responseData
    };
  } catch (error) {
    console.error("Error sending webhook:", error);
    throw error;
  }
}