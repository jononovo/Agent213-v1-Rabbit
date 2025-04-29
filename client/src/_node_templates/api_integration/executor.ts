/**
 * API Integration Node Template - Executor
 * 
 * Handles the execution logic for the API integration node.
 * This file contains the core functionality for making API requests to external services.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';
import { NodeExecutionData } from '@/nodes/types';

/**
 * Define configuration data interface for this node
 * CUSTOMIZE THIS: Update this interface to match your node's settings
 */
export interface ApiNodeData {
  apiKey: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  timeout: number;
}

/**
 * Default configuration for the node
 * CUSTOMIZE THIS: Set appropriate defaults for your API node
 */
export const defaultData: ApiNodeData = {
  apiKey: '',
  endpoint: '/v1/resource',
  method: 'POST',
  timeout: 10000
};

/**
 * Execute the API node
 * This function makes the API request and processes the response
 */
export const execute = async (
  data: ApiNodeData, 
  inputs: Record<string, any>
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Extract inputs
    const inputData = inputs.data;
    const parameters = inputs.parameters || {};
    
    // Validate inputs
    if (!inputData && data.method !== 'GET') {
      return createErrorOutput('Input data is required for this API request');
    }

    // Get API key from node settings or environment variable
    // CUSTOMIZE THIS: Update with your specific API key environment variable
    const apiKey = data.apiKey || import.meta.env.VITE_API_KEY;

    if (!apiKey) {
      return createErrorOutput('API key is required. Please configure it in the node settings or provide it as an environment variable.');
    }

    // Build the API URL
    // CUSTOMIZE THIS: Update with your API's base URL
    const baseUrl = 'https://api.example.com';
    const endpoint = data.endpoint || defaultData.endpoint;
    
    // Handle query parameters for GET requests
    let url = `${baseUrl}${endpoint}`;
    if (data.method === 'GET' && inputData && typeof inputData === 'object') {
      const queryParams = new URLSearchParams();
      Object.entries(inputData).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url = `${url}?${queryParams.toString()}`;
    }
    
    // Prepare request headers
    // CUSTOMIZE THIS: Update with your API's authentication method
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Add any additional headers from parameters
    if (parameters.headers && typeof parameters.headers === 'object') {
      Object.entries(parameters.headers).forEach(([key, value]) => {
        headers[key] = String(value);
      });
    }
    
    // Set up request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), data.timeout || defaultData.timeout);
    
    // Prepare the request options
    const requestOptions: RequestInit = {
      method: data.method,
      headers,
      signal: controller.signal
    };
    
    // Add body for non-GET requests
    if (data.method !== 'GET' && inputData) {
      requestOptions.body = JSON.stringify(inputData);
    }
    
    try {
      // Make the API request
      const response = await fetch(url, requestOptions);
      
      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `API error: ${response.status} ${response.statusText}`;
        return createErrorOutput(errorMessage);
      }
      
      // Parse successful response
      const responseData = await response.json();
      
      // Return output with response data and metadata
      return createNodeOutput(
        {
          response: responseData,
          metadata: {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }
        }, 
        { 
          startTime,
          additionalMeta: {
            url,
            method: data.method,
            responseTime: new Date().getTime() - startTime.getTime()
          }
        }
      );
    } finally {
      // Always clear the timeout
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    console.error('API request error:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return createErrorOutput(`API request timed out after ${data.timeout || defaultData.timeout}ms`);
      }
      return createErrorOutput(`Error making API request: ${error.message}`);
    }
    return createErrorOutput('Unknown error making API request');
  }
};