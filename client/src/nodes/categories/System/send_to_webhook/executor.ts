/**
 * Send to Webhook Node Executor
 * 
 * This file handles the execution logic for the send_to_webhook node,
 * which sends data to an external webhook endpoint or API.
 * 
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';

/**
 * Type definition for webhook node configuration
 */
interface SendToWebhookNodeData {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  retryCount: number;
  retryDelay: number;
  timeout: number;
  contentType?: 'application/json' | 'application/x-www-form-urlencoded' | 'text/plain';
  errorHandling?: 'fail' | 'warn' | 'ignore';
  respondToOriginal?: boolean | string; // New field name
  isWebhookResponse?: boolean | string; // Legacy field name (for backward compatibility)
  settings?: {
    respondToOriginal?: boolean | string;
    contentType?: string;
    errorHandling?: string;
    [key: string]: any;
  };
}

/**
 * Process the webhook node
 * Implements the core logic specific to sending data to webhooks
 */
async function processNode(
  nodeData: SendToWebhookNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // Get input data
  const inputData = inputs.data?.items?.[0]?.json || {};
  
  // Check if this is responding to an original webhook request
  // This can be specified either in the node settings or detected from the input
  // Handle both string 'true' and boolean true values from the UI
  const respondToOriginal = 
    nodeData.respondToOriginal === true || 
    nodeData.respondToOriginal === 'true' || 
    nodeData.isWebhookResponse === true || 
    nodeData.isWebhookResponse === 'true' ||
    (nodeData.settings && 
      (nodeData.settings.respondToOriginal === true || 
       nodeData.settings.respondToOriginal === 'true'));
  
  // Handle webhook response if applicable and if we have a requestId
  if (respondToOriginal && inputData.requestId && inputData.isWebhookRequest) {
    console.log('Send to webhook node is handling webhook response for request:', inputData.requestId);
    
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
    return {
      webhookResponse: {
        success: result.success,
        message: result.message,
        requestId: inputData.requestId
      },
      meta: {
        isWebhookResponse: true,
        handled: result.success
      }
    };
  }
  
  // Regular webhook sending logic for non-response cases
  // Validate required fields for external webhook calls
  // Only require URL if we're not responding to an original webhook
  
  // Special handling for URLs: try to extract from input data if not in nodeData
  let effectiveUrl = nodeData.url;
  
  // Look for URLs directly in the input data
  if (!effectiveUrl && inputData) {
    if (typeof inputData.url === 'string') {
      effectiveUrl = inputData.url;
    } else if (typeof inputData.webhookUrl === 'string') {
      effectiveUrl = inputData.webhookUrl;
    } else if (typeof inputData.callbackUrl === 'string') {
      effectiveUrl = inputData.callbackUrl;
    } else if (inputData.json && typeof inputData.json.callbackUrl === 'string') {
      // Look inside 'json' property if it exists
      effectiveUrl = inputData.json.callbackUrl;
    }
  }
  
  // Debug information
  console.log('URL detection results:', { 
    nodeDataUrl: nodeData.url,
    inputDataUrl: inputData?.url,
    inputDataWebhookUrl: inputData?.webhookUrl,
    inputDataCallbackUrl: inputData?.callbackUrl,
    inputDataJsonCallbackUrl: inputData?.json?.callbackUrl,
    effectiveUrl: effectiveUrl
  });
  
  // Use the discovered URL for the request
  if (!respondToOriginal && !effectiveUrl) {
    console.error('URL detection failed. Input data:', JSON.stringify(inputData, null, 2));
    throw new Error('Webhook URL is required');
  }
  
  // Extract settings
  const {
    url,
    method,
    headers = {},
    retryCount = 3,
    retryDelay = 1000,
    timeout = 5000,
    contentType = 'application/json',
    errorHandling = 'fail'
  } = nodeData;
  
  // Extract the json property if it exists and use it as the data to send
  const dataToSend = inputData.json || inputData;
  
  console.log('Preparing to send data:', dataToSend);
  
  // Set up the appropriate content type and body formatting based on contentType
  let formattedBody;
  if (contentType === 'application/json') {
    formattedBody = JSON.stringify(dataToSend);
  } else if (contentType === 'application/x-www-form-urlencoded') {
    // Convert object to URL encoded format
    const params = new URLSearchParams();
    for (const key in dataToSend) {
      if (typeof dataToSend[key] !== 'object') {
        params.append(key, dataToSend[key]);
      } else {
        params.append(key, JSON.stringify(dataToSend[key]));
      }
    }
    formattedBody = params.toString();
  } else {
    // Default to string representation for text/plain
    formattedBody = typeof dataToSend === 'string' ? 
      dataToSend : JSON.stringify(dataToSend);
  }
  
  // Set up request options
  const requestOptions = {
    method,
    headers: {
      'Content-Type': contentType,
      ...headers
    },
    body: formattedBody,
    timeout
  };
  
  // Skip the HTTP request if we're responding to an original webhook
  // This handles the case where URL is not provided but respondToOriginal is true
  if (respondToOriginal) {
    return {
      response: { success: true, message: "This node is configured to respond to the original webhook" },
      status: 200,
      headers: {},
      meta: {
        success: true,
        isWebhookResponse: true,
        status: 200,
        message: "Configured to respond to original webhook"
      }
    };
  }
  
  // Make the request with retry logic for external webhook
  try {
    const result = await makeRequestWithRetry(
      effectiveUrl || url, // Use the extracted URL if available
      requestOptions, 
      timeout, 
      retryCount, 
      retryDelay
    );
    
    // Return the result - BaseExecutor will format this into standardized output
    return {
      response: result.data,
      status: result.status,
      headers: result.headers,
      meta: {
        url: effectiveUrl || url, // Use the same URL that was used for the request
        method,
        contentType,
        success: true,
        status: result.status
      }
    };
  } catch (error: any) { // Use type 'any' for error to access message property
    // Handle errors based on errorHandling setting
    console.error('Webhook request error:', error);
    
    // Get error message with fallback
    const errorMessage = error?.message || 'Webhook request failed';
    
    if (errorHandling === 'fail') {
      throw error; // Re-throw to fail the workflow
    } else if (errorHandling === 'warn') {
      console.warn('Webhook request failed but continuing due to error handling setting:', error);
      // Return a warning response
      return {
        response: { 
          error: errorMessage, 
          warning: 'Request failed but workflow continued due to error handling setting'
        },
        status: 0,
        headers: {},
        meta: {
          url: effectiveUrl || url,
          method,
          contentType,
          success: false,
          errorHandled: true,
          status: 0,
          error: errorMessage
        }
      };
    } else { // 'ignore'
      // Return an empty success response
      return {
        response: { note: 'Error ignored per node settings' },
        status: 200,
        headers: {},
        meta: {
          url: effectiveUrl || url,
          method,
          contentType,
          success: true,
          errorIgnored: true,
          status: 200
        }
      };
    }
  }
}

/**
 * Function to make the request with retry logic
 */
async function makeRequestWithRetry(
  url: string,
  requestOptions: any,
  timeout: number,
  retryCount: number,
  retryDelay: number
): Promise<any> {
  let attempts = 0;
  
  while (true) {
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
      attempts++;
      if (attempts <= retryCount) {
        console.log(`Webhook request failed, retrying in ${retryDelay}ms (${attempts}/${retryCount})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Otherwise, throw the error
      throw error;
    }
  }
}

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<SendToWebhookNodeData>('send_to_webhook', processNode);