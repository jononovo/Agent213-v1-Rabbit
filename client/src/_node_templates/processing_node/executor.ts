/**
 * Processing Node Template - Executor
 * 
 * This file handles the execution logic for the processing node.
 * It processes input data using a custom JavaScript function.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';

// Define simple interface for node data
interface ProcessingNodeData {
  processingMode?: string;
  processingLogic?: string;
  timeout?: number;
}

/**
 * Execute function for the processing node
 * This applies the provided processing logic to the input data
 */
export const execute = async (
  nodeData: ProcessingNodeData,
  inputs: Record<string, any>
): Promise<any> => {
  const startTime = new Date();
  
  try {
    // Extract data from inputs
    const inputData = inputs.data?.items?.[0]?.json || inputs.data || {};
    const optionsData = inputs.options?.items?.[0]?.json || inputs.options || {};
    
    // Extract node settings with defaults
    const {
      processingLogic = 'function process(data, options) { return data; }',
      timeout = 5000
    } = nodeData;
    
    // Execute the processing logic with timeout protection
    const result = await executeWithTimeout(
      inputData,
      optionsData,
      processingLogic,
      timeout
    );
    
    // Return the result
    return createNodeOutput(
      { result },
      { startTime }
    );
  } catch (error: any) {
    console.error('Processing node error:', error);
    
    return createErrorOutput(
      error.message || 'Error processing data',
      'my_processing_node' // CHANGE THIS to match your node type
    );
  }
};

/**
 * Execute processing logic with timeout protection
 */
async function executeWithTimeout(
  data: any,
  options: any,
  processingLogic: string,
  timeout: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Processing timed out after ${timeout}ms`));
    }, timeout);
    
    try {
      // Create the processing function
      const functionBody = `
        ${processingLogic}
        return process(data, options);
      `;
      
      const processFunction = new Function('data', 'options', functionBody);
      
      // Execute the function
      Promise.resolve(processFunction(data, options))
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    } catch (error: any) {
      clearTimeout(timeoutId);
      reject(new Error(`Processing error: ${error.message}`));
    }
  });
}