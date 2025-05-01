/**
 * API Integration Node Executor
 * 
 * This executor handles external API requests through the Integration Engine.
 * It supports various HTTP methods, authentication, and error handling.
 * 
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 */

import { NodeExecutionData } from '@/nodes/core/types/nodeExecutionTypes';
import { createNodeExecutor } from '@/nodes/core/base/NodeExecutorBase';
import { ApiIntegrationData, defaultData } from './definition';

// Re-export the default data for use in UI
export { defaultData };
export type { ApiIntegrationData };

/**
 * Process the API integration node
 * Implements the core logic for making API requests
 */
async function processNode(
  nodeData: ApiIntegrationData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // Extract inputs with validation
  const inputData = inputs.data?.items[0]?.json || {};
  
  // Get URL from input or node configuration
  const url = inputData.url || nodeData.url;
  if (!url) {
    throw new Error('URL is required but was not provided');
  }
  
  // Get headers from input or node configuration
  const configHeaders = nodeData.headers || {};
  const inputHeaders = inputData.headers || {};
  const headers = { ...configHeaders, ...inputHeaders };
  
  // Get body from input or node configuration
  const body = inputData.body || nodeData.body;
  
  // Get URL parameters from input
  const params = inputData.params || {};
  
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
    timeout: nodeData.timeout || 30000,
    retries: nodeData.retries || 3,
  };
  
  // Log the request details
  console.log(`API Integration: Making ${nodeData.method} request to ${fullUrl}`);
  
  try {
    // In a real implementation, this would use the Integration Engine proxy
    // For the template, we'll simulate a successful response
    const simulatedResponse = {
      data: { message: 'Success', requestDetails: request },
      status: 200,
      headers: { 'content-type': 'application/json' }
    };
    
    // Return the result - BaseExecutor will format this into standardized output
    return {
      response: simulatedResponse.data,
      status: simulatedResponse.status,
      headers: simulatedResponse.headers,
      meta: {
        url: fullUrl,
        method: nodeData.method,
        success: true
      }
    };
  } catch (error) {
    // BaseExecutor will handle error formatting and propagation
    throw new Error(`API Request Failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<ApiIntegrationData>('api_integration', processNode);