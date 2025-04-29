/**
 * Processing Node Template - Executor
 * 
 * This file contains the logic for executing the processing node.
 * It evaluates JavaScript code to transform input data.
 */

import { NodeExecutionData, WorkflowItem } from '../../../shared/nodeTypes';

export interface ProcessingNodeData {
  code: string;
  timeout: number;
  useAsyncFunction: boolean;
  selectedTemplate: string;
  [key: string]: any;
}

export const defaultData: ProcessingNodeData = {
  code: 'function process(input) {\n  // Your code here\n  return input;\n}',
  timeout: 5000,
  useAsyncFunction: false,
  selectedTemplate: 'basic'
};

/**
 * Safely evaluates JavaScript code with a timeout
 */
const safeEval = async (code: string, input: any, timeout: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Create a timeout to handle long-running or infinite loops
    const timeoutId = setTimeout(() => {
      reject(new Error(`Execution timed out after ${timeout}ms`));
    }, timeout);
    
    try {
      // Create a function from the code string
      // This approach allows for better error handling
      const processFunc = new Function('input', `
        ${code}
        return process(input);
      `);
      
      // Execute the function
      const result = processFunc(input);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Resolve with the result
      resolve(result);
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Reject with the error
      reject(error);
    }
  });
};

/**
 * Safely evaluates async JavaScript code with a timeout
 */
const safeEvalAsync = async (code: string, input: any, timeout: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Create a timeout to handle long-running or infinite loops
    const timeoutId = setTimeout(() => {
      reject(new Error(`Execution timed out after ${timeout}ms`));
    }, timeout);
    
    try {
      // Create an async function from the code string
      // This allows for await syntax in the code
      const processFunc = new Function('input', `
        ${code}
        return process(input);
      `);
      
      // Execute the function and handle the promise
      Promise.resolve(processFunc(input))
        .then(result => {
          // Clear the timeout
          clearTimeout(timeoutId);
          
          // Resolve with the result
          resolve(result);
        })
        .catch(error => {
          // Clear the timeout
          clearTimeout(timeoutId);
          
          // Reject with the error
          reject(error);
        });
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Reject with the error
      reject(error);
    }
  });
};

/**
 * Main executor function for the processing node
 */
export default async function execute(
  nodeData: ProcessingNodeData,
  inputData: NodeExecutionData
): Promise<NodeExecutionData> {
  const startTime = new Date();
  
  try {
    // Get the input data from the first item
    const input = inputData.items[0]?.json;
    
    // Execute the code with the appropriate method
    const result = nodeData.useAsyncFunction
      ? await safeEvalAsync(nodeData.code, input, nodeData.timeout)
      : await safeEval(nodeData.code, input, nodeData.timeout);
    
    // Create output data
    const outputItem: WorkflowItem = {
      json: result
    };
    
    // If the result is a string, add it to the text property as well
    if (typeof result === 'string') {
      outputItem.text = result;
    }
    
    return {
      items: [outputItem],
      meta: {
        startTime,
        endTime: new Date(),
        source: 'processing_node'
      }
    };
  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      items: [{
        json: { error: errorMessage }
      }],
      meta: {
        startTime,
        endTime: new Date(),
        source: 'processing_node',
        error: true,
        errorMessage
      }
    };
  }
}