/**
 * API Integration Node Executor
 * 
 * This executor handles external API requests through the Integration Engine.
 * It supports various HTTP methods, authentication, and error handling.
 */

// We're using a simplified interface here for the template
// In a real implementation, import from the correct path
interface NodeExecutor<T> {
  (node: { id: string; data: T }, inputs: Record<string, any[]>, context?: any): Promise<Record<string, any[]>>;
}

import { ApiIntegrationData, defaultData } from './definition';

// Re-export the default data for use in UI
export { defaultData };
export type { ApiIntegrationData };

// Node executor function
export const executor: NodeExecutor<ApiIntegrationData> = async (node, inputs, context) => {
  try {
    // Get node data and merge with any input overrides
    const nodeData = node.data;
    
    // Get URL from input or node configuration
    const url = inputs.url?.[0]?.json || nodeData.url;
    
    // Get headers from input or node configuration
    const configHeaders = nodeData.headers || {};
    const inputHeaders = inputs.headers?.[0]?.json || {};
    const headers = { ...configHeaders, ...inputHeaders };
    
    // Get body from input or node configuration
    const body = inputs.body?.[0]?.json || nodeData.body;
    
    // Get URL parameters from input
    const params = inputs.params?.[0]?.json || {};
    
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    
    // Build the complete URL with query parameters
    const fullUrl = `${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    // Prepare the request
    const request = {
      url: fullUrl,
      method: nodeData.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timeout: nodeData.timeout,
      retries: nodeData.retries,
    };
    
    // Log the request details
    console.log(`API Integration: Making ${nodeData.method} request to ${fullUrl}`);
    
    // In a real implementation, this would use the Integration Engine proxy
    // For the template, we'll simulate a successful response
    const simulatedResponse = {
      data: { message: 'Success', requestDetails: request },
      status: 200,
      headers: { 'content-type': 'application/json' }
    };
    
    // Return the response data to output ports
    return {
      response: [{ json: simulatedResponse.data }],
      status: [{ json: simulatedResponse.status }],
      headers: [{ json: simulatedResponse.headers }],
      error: []
    };
  } catch (error) {
    // Handle errors
    console.error('API integration execution error:', error);
    
    // Provide error details to the error output port
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      code: 'API_REQUEST_FAILED',
      timestamp: new Date().toISOString()
    };
    
    return {
      response: [],
      status: [{ json: 500 }],
      headers: [],
      error: [{ json: errorDetails }]
    };
  }
};