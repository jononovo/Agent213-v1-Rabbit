/**
 * Webhook Callback Test Node Implementation
 * 
 * This node allows testing webhook callbacks by sending data to a specified URL
 */

import { NodeExecutionData, WorkflowItem } from '@shared/nodeTypes';

/**
 * Execute the webhook callback test node
 */
export async function execute(
  inputs: Record<string, WorkflowItem[]>,
  settings: Record<string, any>
): Promise<NodeExecutionData> {
  const startTime = new Date();
  const results: WorkflowItem[] = [];
  
  try {
    // Get settings
    const url = settings.url || (inputs.url?.[0]?.json || '');
    const method = settings.method || 'POST';
    const contentType = settings.contentType || 'application/json';
    const useInputData = settings.useInputData || false;
    
    // Check if URL is provided
    if (!url) {
      throw new Error('No URL provided for webhook callback');
    }
    
    // Prepare data to send
    let data: any;
    if (useInputData && inputs.data && inputs.data.length > 0) {
      data = inputs.data[0].json;
    } else {
      // Use template data
      try {
        data = settings.templateData ? JSON.parse(settings.templateData) : {};
      } catch (error: any) {
        throw new Error(`Error parsing template data: ${error?.message || 'Invalid JSON'}`);
      }
    }
    
    // Generate unique search ID if not present
    if (!data.searchId) {
      data.searchId = `test-${Date.now()}`;
    }
    
    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': contentType
    };
    
    // Add authorization if configured
    if (settings.includeAuthToken && settings.authToken) {
      headers['Authorization'] = `Bearer ${settings.authToken}`;
    }
    
    // Merge any input headers
    if (inputs.headers && inputs.headers.length > 0) {
      const inputHeaders = inputs.headers[0].json;
      Object.assign(headers, inputHeaders);
    }
    
    // Log the request
    console.log(`Sending webhook to ${url} with method ${method}`, { headers, data });
    
    // Send the request to the server-side endpoint
    const response = await fetch('/api/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callbackUrl: url,
        data,
        method,
        headers
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook request failed: ${response.status} ${errorText}`);
    }
    
    // Parse response
    const responseData = await response.json();
    
    // Create result
    results.push({
      json: {
        success: true,
        url,
        method,
        data,
        response: responseData
      }
    });
    
    // Return successful result
    return {
      items: results,
      meta: {
        startTime,
        endTime: new Date()
      }
    };
  } catch (error: any) {
    // Return error result
    const errorMessage = error?.message || 'Unknown error';
    return {
      items: [{
        json: {
          success: false,
          error: errorMessage
        }
      }],
      meta: {
        startTime,
        endTime: new Date(),
        error: true,
        errorMessage: errorMessage
      }
    };
  }
}