/**
 * Embed Other Workflow Node Executor
 * 
 * Handles the execution logic for the Embed Other Workflow node,
 * managing API calls to trigger other workflows and process their results.
 */

// Import types from core
import { 
  NodeExecutionData,
  WorkflowItem 
} from '../../../core/types/nodeExecutionTypes';

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
 * Execute an Embed Other Workflow node with the provided input
 */
export async function execute(
  nodeData: EmbedWorkflowNodeData,
  input?: NodeExecutionData
): Promise<NodeExecutionData> {
  const startTime = new Date();
  const meta = {
    startTime,
    endTime: new Date(),
    source: 'embed_other_workflow',
    error: false,
    errorMessage: ''
  };
  
  // Validate input - ensure we have valid items to process
  if (!input || !input.items || !Array.isArray(input.items)) {
    // Create a default input with a single empty item if none is provided
    input = {
      items: [{ json: {} }],
      meta: {
        startTime,
        endTime: new Date()
      }
    };
  }
  
  try {
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
    
    // Process the result
    const endTime = new Date();
    const processedItems: WorkflowItem[] = [
      {
        json: workflowResult,
        meta: {
          source: 'embed_other_workflow',
          timestamp: endTime
        }
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
    
    return {
      items: input.items.map(item => ({
        json: { error: true, message: errorMessage },
        meta: {
          source: 'embed_other_workflow',
          timestamp: new Date()
        }
      })),
      meta: {
        ...meta,
        endTime: new Date(),
        error: true,
        errorMessage: `Embed Other Workflow error: ${errorMessage}`
      }
    };
  }
}