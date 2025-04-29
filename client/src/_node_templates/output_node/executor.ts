/**
 * Output Node Template - Executor
 * 
 * This file handles the execution logic for the output node.
 * It contains the functionality to send data to external systems or handle workflow endpoints.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// Define the output node data interface
// CUSTOMIZE THIS: Update this interface to match your node's settings
interface OutputNodeData {
  destinationUrl: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  formatOutput: boolean | string;
  responseMode: 'full' | 'data' | 'status';
  retryCount: number;
  retryDelay: number;
  timeout: number;
}

/**
 * Execute function for the output node
 * This sends data to the configured destination
 */
export const execute = async (
  nodeData: OutputNodeData,
  inputs: Record<string, any>
): Promise<any> => {
  const startTime = new Date();
  
  try {
    // Get input data
    const inputData = inputs.data?.items?.[0]?.json || inputs.data || {};
    const metadataInput = inputs.metadata?.items?.[0]?.json || inputs.metadata || {};
    
    // Format output if configured
    // CUSTOMIZE THIS: Implement your specific formatting logic
    const formattedData = shouldFormatOutput(nodeData.formatOutput) 
      ? formatOutputData(inputData, metadataInput) 
      : inputData;
    
    // If no destination URL is provided, this could be a special case
    // For example, the node might be used to format data only or as a workflow endpoint
    if (!nodeData.destinationUrl) {
      // CUSTOMIZE THIS: Implement your specific handling for no destination
      console.log('Output node executed without destination URL');
      
      return createNodeOutput(
        {
          status: 200,
          response: {
            message: 'Output processed successfully (no destination URL)',
            data: formattedData
          }
        },
        {
          startTime,
          additionalMeta: {
            outputType: 'formatted',
            destinationProvided: false,
            responseMode: nodeData.responseMode
          }
        }
      );
    }
    
    // Extract settings
    const {
      destinationUrl,
      method,
      headers = {},
      retryCount = 3,
      retryDelay = 1000,
      timeout = 5000
    } = nodeData;
    
    // Set up request options
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(formattedData),
      timeout
    };
    
    // Function to make the request with retry logic
    const makeRequestWithRetry = async (attempts: number): Promise<any> => {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Make the request
        const response = await fetch(destinationUrl, {
          ...requestOptions,
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Parse the response
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
        
        return {
          data: responseData,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error: any) {
        // If we have attempts left, retry after delay
        if (attempts < retryCount) {
          console.log(`Output request failed, retrying in ${retryDelay}ms (${attempts + 1}/${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return makeRequestWithRetry(attempts + 1);
        }
        
        // Otherwise, throw the error
        throw error;
      }
    };
    
    // Make the request with retry logic
    const result = await makeRequestWithRetry(0);
    
    // Determine what to return based on response mode
    let outputResult;
    
    switch (nodeData.responseMode) {
      case 'full':
        outputResult = {
          response: result.data,
          status: result.status,
          headers: result.headers
        };
        break;
      case 'data':
        outputResult = {
          response: result.data
        };
        break;
      case 'status':
        outputResult = {
          status: result.status
        };
        break;
      default:
        outputResult = {
          response: result.data,
          status: result.status
        };
    }
    
    // Return the result
    return createNodeOutput(
      outputResult,
      {
        startTime,
        additionalMeta: {
          url: destinationUrl,
          method,
          success: true,
          status: result.status
        }
      }
    );
  } catch (error: any) {
    console.error('Error in output node executor:', error);
    
    return createErrorOutput(
      error.message || 'Error sending data to destination',
      'my_output_node' // CHANGE THIS to match your node type
    );
  }
};

/**
 * Helper function to determine if output should be formatted
 */
function shouldFormatOutput(formatOutput: boolean | string): boolean {
  return formatOutput === true || formatOutput === 'true';
}

/**
 * Helper function to format output data
 * CUSTOMIZE THIS: Implement your specific formatting logic
 */
function formatOutputData(data: any, metadata: any): any {
  // Simple example formatting: merge data with metadata
  // and add timestamp and version information
  
  // Clone data to avoid modifying the original object
  const formattedData = JSON.parse(JSON.stringify(data));
  
  // Add metadata if present
  if (metadata && Object.keys(metadata).length > 0) {
    formattedData.metadata = metadata;
  }
  
  // Add timestamp
  formattedData.timestamp = new Date().toISOString();
  
  // Add version info
  formattedData.version = '1.0.0';
  
  return formattedData;
}