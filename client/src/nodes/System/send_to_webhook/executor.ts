/**
 * Send to Webhook Node Executor
 * 
 * This file handles the execution logic for the send_to_webhook node,
 * which sends data to an external webhook endpoint or API.
 * 
 * Updated to support responding to the original webhook request
 * when used in a webhook-triggered workflow.
 */

import { createNodeOutput, createErrorOutput } from '../../nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// Define the send to webhook node data interface
interface SendToWebhookNodeData {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  retryCount: number;
  retryDelay: number;
  timeout: number;
  isWebhookResponse?: boolean; // New option to indicate this should respond to the original webhook
}

// Interface for the webhook request context
interface WebhookResponseContext {
  isWebhookResponse?: boolean;
  originalWebhookRequest?: {
    path: string;
    method: string;
  };
  requestId?: string;
}

/**
 * Execute function for the send to webhook node
 * This sends data to the configured webhook endpoint or API
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
    const isWebhookResponse = nodeData.isWebhookResponse === true || 
      (inputData.responseContext?.isWebhookResponse === true);
    
    // Extract response context from the input if available
    const responseContext: WebhookResponseContext = inputData.responseContext || {};
    
    // Handle webhook response if applicable
    if (isWebhookResponse) {
      console.log('Send to webhook node is handling the original webhook response');
      
      // Signal that we've handled the webhook response
      // This will be detected by the runWorkflow function in server/routes.ts
      const webhookResponseOutput = {
        webhookResponseHandled: true,
        response: {
          success: true,
          message: "Webhook response handled by send_to_webhook node",
          data: inputData.payload || inputData,
          requestId: responseContext.requestId
        },
        originalRequest: responseContext.originalWebhookRequest
      };
      
      // Return the result indicating we're handling the webhook response
      return createNodeOutput(
        webhookResponseOutput,
        {
          startTime,
          additionalMeta: {
            isWebhookResponse: true,
            webhookResponseHandled: true
          }
        }
      );
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
        headers: result.headers,
        webhookResponseHandled: false // Indicate this was a regular webhook, not a response
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