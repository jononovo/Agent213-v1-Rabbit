/**
 * Embed Other Workflow Node Executor
 * 
 * Handles the execution logic for the Embed Other Workflow node,
 * managing API calls to trigger other workflows and process their results.
 * 
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 */

import { NodeExecutionData, WorkflowItem } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';

/**
 * Type definition for this node's specific configuration
 */
interface EmbedWorkflowNodeData {
  workflowId?: number | string | null;
  inputField?: string;
  timeout?: number;
  waitForCompletion?: boolean;
  [key: string]: any;
}

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
 * Process the Embed Other Workflow node
 * This implements the core logic specific to the node
 */
async function processNode(
  nodeData: EmbedWorkflowNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // Find the first input with items
  let input: NodeExecutionData | undefined;
  for (const key in inputs) {
    if (inputs[key] && inputs[key].items && Array.isArray(inputs[key].items)) {
      input = inputs[key];
      break;
    }
  }
  
  // Create default input if none was provided
  if (!input || !input.items || !Array.isArray(input.items)) {
    input = {
      items: [{ json: {} }],
      meta: {
        startTime: new Date(),
        endTime: new Date()
      }
    };
  }
  
  // Validate required workflow ID
  if (!nodeData.workflowId) {
    throw new Error('No workflow selected. Please configure the node with a valid workflow.');
  }

  console.log(`Triggering workflow ID ${nodeData.workflowId} with ${input.items.length} items`);
  
  // Format the input data based on the selected inputField
  const inputField = nodeData.inputField || 'json';
  const timeout = nodeData.timeout || 30000;
  const waitForCompletion = nodeData.waitForCompletion !== false;
  
  const triggerPayload = {
    workflowId: nodeData.workflowId,
    inputData: input.items.map(item => {
      if (inputField === 'json') {
        return item.json;
      } else if (inputField === 'content' && item.json?.content) {
        return item.json.content;
      } else if (typeof item.json === 'string') {
        // Handle case where text might be stored in json
        return item.json;
      }
      return item.json; // Default to json if no match
    })
  };
  
  // Call the API to trigger the workflow
  let workflowResult;
  if (waitForCompletion) {
    // Execute and wait for results
    workflowResult = await apiRequest('/api/workflows/execute', 'POST', {
      workflowId: nodeData.workflowId,
      input: triggerPayload.inputData,
      timeout: timeout
    });
  } else {
    // Trigger execution without waiting
    workflowResult = await apiRequest('/api/workflows/trigger', 'POST', {
      workflowId: nodeData.workflowId,
      input: triggerPayload.inputData
    });
  }
  
  // Return the result - BaseExecutor will handle the formatting
  return {
    result: workflowResult,
    details: {
      workflowId: nodeData.workflowId,
      inputItemCount: input.items.length,
      waitedForCompletion: waitForCompletion
    }
  };
}

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<EmbedWorkflowNodeData>('embed_other_workflow', processNode);