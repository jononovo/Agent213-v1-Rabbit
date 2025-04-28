/**
 * Workflow Trigger Node Executor
 * 
 * Handles the execution logic for the Workflow Trigger node,
 * managing API calls to trigger other workflows and process their results.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';

// Helper function to make API requests
async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'same-origin'
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    // Return text if not valid JSON
    return await response.text();
  }
}

/**
 * The main executor function for the workflow trigger node
 * 
 * This function is called when the node is executed in a workflow
 */
async function execute(nodeData: any, inputs: Record<string, any>): Promise<any> {
  console.log('Workflow Trigger Node - Starting execution', nodeData);
  
  const startTime = new Date();
  
  try {
    // Extract configuration from node data
    const workflowId = nodeData.workflowId;
    const inputField = nodeData.inputField || 'json';
    const timeout = nodeData.timeout || 30000;
    const waitForCompletion = nodeData.waitForCompletion !== false; // Default to true
    
    // Validate workflow ID
    if (!workflowId) {
      throw new Error('Missing workflow ID in configuration');
    }
    
    // Extract input data from connected nodes
    let inputData: any = null;
    
    if (inputs && Object.keys(inputs).length > 0) {
      const firstInput = Object.values(inputs)[0];
      if (firstInput?.items?.length > 0) {
        const item = firstInput.items[0];
        
        // Get data based on specified input field
        if (inputField === 'json' && item.json) {
          inputData = item.json;
        } else if (inputField === 'text' && item.json?.text) {
          inputData = item.json.text;
        } else if (inputField === 'content' && item.json?.content) {
          inputData = item.json.content;
        } else {
          // Default fallback - use whatever we can get
          inputData = item.json || item.text || item;
        }
      }
    }
    
    // Execute the workflow via API
    console.log(`Triggering workflow ${workflowId} with input:`, inputData);
    
    // Create a promise for the API call
    const responsePromise = apiRequest(`/workflows/${workflowId}/execute`, 'POST', {
      input: inputData,
      metadata: {
        source: 'workflow_trigger',
        parentNodeId: nodeData.id || 'unknown',
        waitForCompletion
      }
    });
    
    // Handle timeout if configured
    let response;
    if (timeout > 0) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Workflow execution timed out after ${timeout}ms`)), timeout);
      });
      
      response = await Promise.race([responsePromise, timeoutPromise]);
    } else {
      response = await responsePromise;
    }
    
    console.log(`Workflow ${workflowId} execution completed:`, response);
    
    // Format the response as a workflow item for output
    const outputItem = {
      json: response?.data || response,
      text: typeof response?.data === 'string' ? response.data : JSON.stringify(response)
    };
    
    return createNodeOutput([outputItem], {
      workflowId: workflowId,
      executionId: response?.executionId || 'unknown',
      waitedForCompletion: waitForCompletion
    });
  } catch (error: any) {
    console.error('Workflow Trigger Node - Execution error:', error);
    
    // Return an error result that can be handled downstream
    return createErrorOutput(
      error.message || 'Unknown error',
      {
        details: error.response?.data || error.stack
      }
    );
  }
}

export default execute;