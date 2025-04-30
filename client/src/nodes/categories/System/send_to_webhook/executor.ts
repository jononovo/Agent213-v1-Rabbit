/**
 * Send to Webhook Node Executor
 * 
 * This file handles the execution logic for the send_to_webhook node,
 * which sends data to an external webhook endpoint or API.
 * 
 * Updated to communicate directly with the Workflow Execution Server
 * for webhook response handling.
 */

import { NodeExecutionData } from '../../../../core/types/nodeExecutionTypes';
import { createNodeOutput, createErrorOutput } from '../../../../core/utils/nodeOutputUtils';

// Define the send to webhook node data interface
interface SendToWebhookNodeData {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  retryCount: number;
  retryDelay: number;
  timeout: number;
  respondToOriginal?: boolean | string; // New field name
  isWebhookResponse?: boolean | string; // Legacy field name (for backward compatibility)
}

/**
 * Execute function for the send to webhook node
 * This sends data to the configured webhook endpoint or API
 * or responds to the original webhook request
 */
export const execute = async (
  nodeData: SendToWebhookNodeData,
  inputs: Record<string, NodeExecutionData>
): Promise<any> => {
  const startTime = new Date();
  
  try {
    // Get input data
    const inputData = inputs.data?.items?.[0]?.json || {};
    
    // Check if this is responding to an original webhook request
    // This can be specified either in the node settings or detected from the input
    // Handle both string 'true' and boolean true values from the UI
    const respondToOriginal = 
      nodeData.respondToOriginal === true || 
      nodeData.respondToOriginal === 'true' || 
      nodeData.isWebhookResponse === true || 
      nodeData.isWebhookResponse === 'true';
    
    // Handle webhook response if applicable and if we have a requestId
    if (respondToOriginal && inputData.requestId && inputData.isWebhookRequest) {
      console.log('Send to webhook node is handling webhook response for request:', inputData.requestId);
      
      try {
        // Send the response directly to the Workflow Execution Server
        const response = await fetch('http://localhost:3002/api/webhook-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requestId: inputData.requestId,
            data: inputData.payload || inputData,
            statusCode: 200 // Default status code
          })
        });
        
        const result = await response.json();
        
        // Return the result indicating we've handled the webhook response
        return createNodeOutput(
          {
            webhookResponse: {
              success: result.success,
              message: result.message,
              requestId: inputData.requestId
            }
          },
          {
            startTime,
            additionalMeta: {
              isWebhookResponse: true,
              handled: result.success
            }
          }
        );
      } catch (error) {
        console.error('Error sending webhook response:', error);
        throw new Error(`Failed to send webhook response: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Regular webhook sending logic for non-response cases
    // Validate required fields for external webhook calls
    if (!nodeData.url) {
      throw new Error('Webhook URL is required');
    }
    
    // Extract settings
    const {
      url,
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
      body: JSON.stringify(inputData),
      timeout
    };
    
    // Function to make the request with retry logic
    const makeRequestWithRetry = async (attempts: number): Promise<any> => {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Make the request
        const response = await fetch(url, {
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
          console.log(`Webhook request failed, retrying in ${retryDelay}ms (${attempts + 1}/${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return makeRequestWithRetry(attempts + 1);
        }
        
        // Otherwise, throw the error
        throw error;
      }
    };
    
    // Make the request with retry logic
    const result = await makeRequestWithRetry(0);
    
    // Return the result
    return createNodeOutput(
      {
        response: result.data,
        status: result.status,
        headers: result.headers
      },
      {
        startTime,
        additionalMeta: {
          url,
          method,
          success: true,
          status: result.status
        }
      }
    );
  } catch (error: any) {
    console.error('Error in send to webhook executor:', error);
    
    return createErrorOutput(
      error.message || 'Error sending data to webhook',
      'send_to_webhook'
    );
  }
};