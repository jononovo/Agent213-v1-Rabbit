/**
 * Embed Other Workflow Node Executor
 * 
 * Handles the execution logic for the Embed Other Workflow node,
 * managing API calls to trigger other workflows and process their results.
 */

import type { NodeExecutionData, WorkflowItem } from '@shared/nodeTypes';
import { EmbedOtherWorkflowNodeData, defaultData } from './ui';  // Import from UI to maintain a single source of truth

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin'
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * The main executor function for the embed_other_workflow node
 */
export const execute = async (
  data: EmbedOtherWorkflowNodeData, 
  inputs: NodeExecutionData
): Promise<NodeExecutionData> => {
  console.log('Executing embed_other_workflow node with data:', data);
  
  // Validate required workflow ID
  if (!data.workflowId) {
    throw new Error('No workflow selected. Please configure the node with a valid workflow.');
  }
  
  // Get input data
  const inputItems = inputs?.items || [];
  if (!inputItems.length) {
    throw new Error('No input data received');
  }
  
  try {
    const startTime = new Date();
    console.log(`Triggering workflow ID ${data.workflowId} with ${inputItems.length} items`);
    
    // Format the input data based on the selected inputField
    const triggerPayload = {
      workflowId: data.workflowId,
      inputData: inputItems.map(item => {
        if (data.inputField === 'json') {
          return item.json;
        } else if (data.inputField === 'text') {
          return item.text;
        } else if (data.inputField === 'content' && item.json?.content) {
          return item.json.content;
        }
        return item;
      })
    };
    
    // Call the API to trigger the workflow
    let workflowResult;
    if (data.waitForCompletion) {
      // Execute and wait for results
      workflowResult = await apiRequest('/api/workflows/execute', 'POST', {
        workflowId: data.workflowId,
        input: triggerPayload.inputData,
        timeout: data.timeout
      });
    } else {
      // Trigger execution without waiting
      workflowResult = await apiRequest('/api/workflows/trigger', 'POST', {
        workflowId: data.workflowId,
        input: triggerPayload.inputData
      });
    }
    
    // Process the result
    const endTime = new Date();
    const processedItems: WorkflowItem[] = [
      {
        json: workflowResult,
        text: JSON.stringify(workflowResult)
      }
    ];
    
    // Return the output data
    return {
      items: processedItems,
      meta: {
        startTime,
        endTime,
        source: 'embed_other_workflow',
        details: workflowResult
      }
    };
  } catch (error: any) {
    console.error('Error executing embed_other_workflow node:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    throw new Error(`Embed Other Workflow error: ${errorMessage}`);
  }
};