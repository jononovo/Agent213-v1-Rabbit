/**
 * Processing Node Template - Executor
 * 
 * This file handles the execution logic for the processing node.
 * It processes input data according to the configured processing mode and logic.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// Define interfaces for node data
interface ProcessingNodeData {
  processingMode: 'transform' | 'filter' | 'aggregate' | 'validate' | 'custom';
  processingLogic: string;
  enableValidation: boolean;
  timeout: number;
  errorHandling: 'throw' | 'continue' | 'fallback';
  fallbackValue?: string;
}

// Simple result cache for identical inputs (optional)
const resultCache = new Map<string, any>();

/**
 * Execute function for the processing node
 * This applies the configured processing logic to the input data
 * 
 * CUSTOMIZE THIS: Modify this function as needed for your specific processing requirements
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
      processingMode = 'transform',
      processingLogic = 'function process(data, options) { return data; }',
      enableValidation = false,
      timeout = 5000,
      errorHandling = 'throw',
      fallbackValue = '{}'
    } = nodeData;
    
    // Validate input data if validation is enabled
    if (enableValidation) {
      // CUSTOMIZE THIS: Implement validation logic specific to your node
      const validationResult = validateInput(inputData, processingMode);
      if (!validationResult.valid) {
        return handleError(
          new Error(`Validation error: ${validationResult.message}`),
          errorHandling,
          fallbackValue,
          startTime
        );
      }
    }
    
    // Process the data with timeout protection
    const result = await processWithTimeout(
      inputData,
      optionsData,
      processingLogic,
      processingMode,
      timeout,
      errorHandling,
      fallbackValue
    );
    
    // Create the output
    return createNodeOutput(
      { result },
      {
        startTime,
        endTime: new Date(),
        additionalMeta: {
          processingMode,
          inputType: typeof inputData,
          outputType: typeof result,
          validated: enableValidation
        }
      }
    );
  } catch (error: any) {
    // Handle unexpected errors in the executor itself
    return handleError(
      error,
      nodeData.errorHandling,
      nodeData.fallbackValue,
      startTime
    );
  }
};

/**
 * Process input data with timeout protection
 * 
 * CUSTOMIZE THIS: Expand this function as needed for additional processing modes
 */
async function processWithTimeout(
  data: any,
  options: any,
  processingLogic: string,
  processingMode: string,
  timeout: number,
  errorHandling: string,
  fallbackValue: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Processing timed out after ${timeout}ms`));
    }, timeout);
    
    try {
      // Create a function from the processing logic
      let processFunction;
      
      try {
        // Prepare the function wrapper
        const functionWrapper = `
          ${processingLogic}
          return process(data, options);
        `;
        
        // Create the function with safety precautions
        processFunction = new Function('data', 'options', `
          try {
            ${functionWrapper}
          } catch (error) {
            throw new Error(\`Processing error: \${error.message}\`);
          }
        `);
      } catch (codeError: any) {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to compile processing logic: ${codeError.message}`));
        return;
      }
      
      // Execute the function
      Promise.resolve(processFunction(data, options))
        .then(result => {
          // Clear timeout and resolve with result
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(execError => {
          // Execution error
          clearTimeout(timeoutId);
          reject(execError);
        });
    } catch (syncError: any) {
      // Sync execution error
      clearTimeout(timeoutId);
      reject(syncError);
    }
  });
}

/**
 * Validate input data based on processing mode
 * 
 * CUSTOMIZE THIS: Add validation rules specific to your processing modes
 */
function validateInput(data: any, mode: string): { valid: boolean; message?: string } {
  switch (mode) {
    case 'transform':
      // For transform mode, just ensure data exists
      if (data === undefined || data === null) {
        return { valid: false, message: 'Input data is required for transform mode' };
      }
      break;
      
    case 'filter':
      // For filter mode, ensure data is an array
      if (!Array.isArray(data)) {
        return { valid: false, message: 'Input data must be an array for filter mode' };
      }
      break;
      
    case 'aggregate':
      // For aggregate mode, ensure data is an array
      if (!Array.isArray(data)) {
        return { valid: false, message: 'Input data must be an array for aggregate mode' };
      }
      break;
      
    case 'validate':
      // For validate mode, ensure data is an object
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return { valid: false, message: 'Input data must be an object for validate mode' };
      }
      break;
      
    case 'custom':
      // For custom mode, no specific validation
      break;
      
    default:
      return { valid: false, message: `Unknown processing mode: ${mode}` };
  }
  
  return { valid: true };
}

/**
 * Handle errors according to the error handling configuration
 */
function handleError(
  error: Error,
  errorHandling: string,
  fallbackValue: string = '{}',
  startTime: Date
): NodeExecutionData {
  console.error('Processing node error:', error);
  
  switch (errorHandling) {
    case 'continue':
      // Continue workflow but with error information
      return createNodeOutput(
        { error: true, message: error.message },
        {
          startTime,
          endTime: new Date(),
          additionalMeta: {
            error: true,
            errorMessage: error.message
          }
        }
      );
      
    case 'fallback':
      // Use fallback value
      try {
        const fallback = fallbackValue ? JSON.parse(fallbackValue) : {};
        
        return createNodeOutput(
          { result: fallback },
          {
            startTime,
            endTime: new Date(),
            additionalMeta: {
              usedFallback: true,
              originalError: error.message
            }
          }
        );
      } catch (e) {
        // If fallback value is invalid JSON, return error
        return createErrorOutput(
          `Invalid fallback value (not valid JSON): ${fallbackValue}`,
          'my_processing_node' // CHANGE THIS to match your node type
        );
      }
      
    case 'throw':
    default:
      // Stop workflow with error
      return createErrorOutput(
        error.message,
        'my_processing_node' // CHANGE THIS to match your node type
      );
  }
}