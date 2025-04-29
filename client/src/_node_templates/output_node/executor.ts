/**
 * Output Node Template - Executor
 * 
 * This file handles the execution logic for the output node.
 * It contains the functionality to send data to external systems.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';

// Define the output node data interface with only essential settings
interface OutputNodeData {
  destinationUrl: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  formatOutput?: boolean;
  timeout?: number;
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
    
    // Format output if configured
    const formattedData = nodeData.formatOutput 
      ? formatOutputData(inputData) 
      : inputData;
    
    // If no destination URL is provided, return the data as is
    if (!nodeData.destinationUrl) {
      return createNodeOutput(
        {
          status: 200,
          response: {
            message: 'Output processed (no destination URL)',
            data: formattedData
          }
        },
        { startTime }
      );
    }
    
    // Extract settings with defaults
    const {
      destinationUrl,
      method = 'POST',
      headers = {},
      timeout = 5000
    } = nodeData;
    
    // Set up request options
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(formattedData)
    };
    
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
    
    // Return the result
    return createNodeOutput(
      {
        response: responseData,
        status: response.status
      },
      {
        startTime,
        additionalMeta: {
          url: destinationUrl,
          method
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
 * Helper function to format output data
 * CUSTOMIZE THIS: Implement your specific formatting logic
 */
function formatOutputData(data: any): any {
  // Simple example formatting: add timestamp
  if (typeof data === 'object' && data !== null) {
    return {
      ...data,
      timestamp: new Date().toISOString()
    };
  }
  return data;
}