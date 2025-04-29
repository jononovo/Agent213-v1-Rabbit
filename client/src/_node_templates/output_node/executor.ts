/**
 * Output Node Template - Executor
 * 
 * This file contains the logic for executing the output node,
 * which sends data to external systems like webhooks, APIs, etc.
 */

import { NodeExecutionData, WorkflowItem } from '../../../shared/nodeTypes';

export interface OutputNodeData {
  outputType: 'webhook' | 'api' | 'database' | 'file' | 'console';
  destination?: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: string;
  transform?: string;
  [key: string]: any;
}

export const defaultData: OutputNodeData = {
  outputType: 'webhook',
  destination: '',
  method: 'POST',
  headers: '{\n  "Content-Type": "application/json"\n}',
  transform: ''
};

/**
 * Transform data using provided JavaScript code
 */
const transformData = (code: string, data: any): any => {
  if (!code || code.trim() === '') {
    return data;
  }

  try {
    // Create a function from the code string
    const transformFunc = new Function('data', `
      ${code}
      return transform(data);
    `);
    
    // Execute the function
    return transformFunc(data);
  } catch (error) {
    console.error('Error transforming data:', error);
    // Return original data if transformation fails
    return data;
  }
};

/**
 * Send data to a webhook or API endpoint
 */
const sendToWebhook = async (data: any, settings: OutputNodeData): Promise<any> => {
  const { destination, method, headers } = settings;
  
  if (!destination) {
    throw new Error('No destination URL provided');
  }
  
  try {
    // Parse headers
    let parsedHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (headers) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        console.warn('Failed to parse headers, using defaults', e);
      }
    }
    
    // Make the request
    const response = await fetch(destination, {
      method: method || 'POST',
      headers: parsedHeaders,
      body: JSON.stringify(data)
    });
    
    // Parse the response
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    };
  } catch (error) {
    throw new Error(`Webhook request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Write data to the console (for testing)
 */
const sendToConsole = (data: any): any => {
  console.log('Output Node - Console Output:', data);
  return { success: true, message: 'Data logged to console' };
};

/**
 * Main executor function for the output node
 */
export default async function execute(
  nodeData: OutputNodeData,
  inputData: NodeExecutionData
): Promise<NodeExecutionData> {
  const startTime = new Date();
  
  try {
    // Get the input data from the first item
    const inputJson = inputData.items[0]?.json;
    
    // Transform data if specified
    const transformedData = nodeData.transform 
      ? transformData(nodeData.transform, inputJson)
      : inputJson;
    
    // Process based on output type
    let result;
    switch (nodeData.outputType) {
      case 'webhook':
      case 'api':
        result = await sendToWebhook(transformedData, nodeData);
        break;
      
      case 'console':
        result = sendToConsole(transformedData);
        break;
      
      // Placeholder for future implementations
      case 'database':
      case 'file':
        result = { 
          success: false, 
          message: `Output type '${nodeData.outputType}' not implemented yet` 
        };
        break;
      
      default:
        result = { 
          success: false, 
          message: `Unknown output type: ${nodeData.outputType}` 
        };
    }
    
    // Create output data
    const outputItem: WorkflowItem = {
      json: result
    };
    
    return {
      items: [outputItem],
      meta: {
        startTime,
        endTime: new Date(),
        source: 'output_node'
      }
    };
  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
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
        source: 'output_node',
        error: true,
        errorMessage
      }
    };
  }
}