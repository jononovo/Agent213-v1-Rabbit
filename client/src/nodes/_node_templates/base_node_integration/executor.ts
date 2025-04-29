/**
 * Base Integration Node Executor
 * 
 * This file contains the execution logic for the integration node.
 * It handles API calls to external services.
 */

// Integration utilities will be available within the system
// import { someUtility } from '@/utils/integrationUtils';

// Define the node data interface
export interface BaseIntegrationNodeData {
  apiEndpoint: string;
  apiKey: string;
  method: string;
  // Add more settings as needed
}

// Default data for the node
export const defaultData: BaseIntegrationNodeData = {
  apiEndpoint: 'https://api.example.com',
  apiKey: '',
  method: 'GET'
};

/**
 * The execute function is called when the node is processed in a workflow
 * 
 * @param nodeData The configuration data for this node instance
 * @param inputs The input data from connected nodes
 * @param context Additional context from the workflow
 * @returns Object with output port names as keys and processed data as values
 */
export const execute = async (
  nodeData: BaseIntegrationNodeData,
  inputs: Record<string, any> = {},
  context?: any
) => {
  try {
    // Log execution start time for performance tracking
    const startTime = new Date();
    
    // Step 1: Get input data and prepare for API call
    const inputData = inputs?.input?.items?.[0]?.json?.text || '';
    const apiEndpoint = nodeData.apiEndpoint;
    const method = nodeData.method;
    
    // Step 2: Make the API call using fetch
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization if API key is provided
    if (nodeData.apiKey) {
      headers['Authorization'] = `Bearer ${nodeData.apiKey}`;
    }
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers
    };
    
    // Add body for POST requests
    if (method === 'POST') {
      requestOptions.body = JSON.stringify({ 
        query: inputData 
        // Add more parameters as required by your API
      });
    }
    
    // Create URL with query params for GET requests
    let url = apiEndpoint;
    if (method === 'GET' && inputData) {
      url += `?query=${encodeURIComponent(inputData)}`;
    }
    
    // Execute the API call
    const response = await fetch(url, requestOptions);
    
    // Step 3: Process the API response
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Step 4: Return processed data to output ports
    return {
      output: {
        items: [{ 
          json: { 
            result: data,
            statusCode: response.status,
            requestUrl: url
          }
        }],
        meta: {
          startTime,
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    console.error('Error in integration node execution:', error);
    
    // Return standardized error format
    return {
      output: {
        items: [{ 
          json: { 
            error: error instanceof Error ? error.message : String(error) 
          }
        }],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: true,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      }
    };
  }
};

// Note: The Integration Engine automatically registers nodes with integrationConfig
// No explicit registration is needed as the engine scans for nodes with this configuration