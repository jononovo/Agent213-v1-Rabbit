/**
 * Enhanced Function Node Executor
 * 
 * This file handles the execution logic for the function_node
 * which allows users to run custom JavaScript functions within workflows.
 * 
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 * 
 * Features:
 * - Advanced error handling
 * - Improved performance with optional result caching
 * - Support for multiple execution environments
 * - Template-based code generation
 * - Timeout protection
 */

// Import from core
import { NodeExecutionData, WorkflowItem } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';

/**
 * Type definition for this node's specific data
 */
interface FunctionNodeData {
  code?: string;
  useAsyncFunction?: boolean;
  timeout?: number;
  errorHandling?: 'throw' | 'return' | 'null';
  cacheResults?: boolean;
  executionEnvironment?: 'client' | 'server';
  [key: string]: any;
}

// Simple result cache for identical inputs
const resultCache = new Map<string, any>();

// Default function code template
const defaultCode = `
/**
 * Process function for transforming input data
 * @param {any} input - The input data to process
 * @param {object} data - Additional data including all items
 * @returns {any} - The processed output
 */
function process(input, data) {
  // Your code here
  return input;
}
`;

/**
 * Process the function node
 * This implements the core logic specific to the function node
 */
async function processNode(
  nodeData: FunctionNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // Ensure we have valid input to process
  const input = ensureValidInput(inputs);
  
  // Extract settings from node data with defaults
  const code = nodeData.code || defaultCode;
  const useAsyncFunction = nodeData.useAsyncFunction !== false;
  const timeout = nodeData.timeout || 5000;
  const errorHandling = nodeData.errorHandling || 'throw';
  const cacheResults = nodeData.cacheResults === true;
  const executionEnvironment = nodeData.executionEnvironment || 'client';
  
  // Server-side execution warning
  if (executionEnvironment === 'server') {
    console.warn('Server-side execution not fully implemented yet, falling back to client-side');
  }
  
  // Check cache for identical inputs if caching is enabled
  if (cacheResults) {
    const cachedResult = checkCache(code, input);
    if (cachedResult) {
      return {
        items: cachedResult.items,
        cached: true
      };
    }
  }
  
  // Create the function to execute
  const processFunction = compileUserFunction(code, useAsyncFunction);
  
  // Process all input items
  const additionalData: Record<string, any> = {
    items: input.items.map(item => item.json),
    timestamp: new Date().toISOString(),
    nodeId: 'function_node',
    environment: executionEnvironment
  };
  
  const resultItems: WorkflowItem[] = [];
  let hasErrors = false;
  
  for (const item of input.items) {
    try {
      const result = await processWithTimeout(
        processFunction, 
        item, 
        additionalData, 
        timeout, 
        errorHandling
      );
      resultItems.push(result);
      
      // Check if this result had an error
      if (result.json && typeof result.json === 'object' && result.json.error === true) {
        hasErrors = true;
      }
    } catch (error: any) {
      // This should only happen if processWithTimeout itself fails
      hasErrors = true;
      resultItems.push({
        json: { error: true, message: error.message },
        text: `Error: ${error.message}`
      });
    }
  }
  
  // Store in cache if appropriate
  if (cacheResults && !hasErrors) {
    try {
      updateCache(code, input, resultItems);
    } catch (cacheError) {
      console.warn('Cache error in function_node:', cacheError);
    }
  }
  
  // Return the results
  return { 
    items: resultItems,
    hasErrors,
    errorMessage: hasErrors ? 'One or more items failed during processing' : ''
  };
}

/**
 * Ensures input is valid, creating a default if not
 */
function ensureValidInput(inputs: Record<string, NodeExecutionData> = {}): NodeExecutionData {
  // Find the first input with items
  for (const key in inputs) {
    if (inputs[key] && inputs[key].items && Array.isArray(inputs[key].items)) {
      return inputs[key];
    }
  }
  
  // Create a default input with a single empty item if none is provided
  return {
    items: [{ json: {}, text: '{}' }],
    meta: {
      startTime: new Date(),
      endTime: new Date()
    }
  };
}

/**
 * Attempts to retrieve a cached result
 */
function checkCache(code: string, input: NodeExecutionData): any {
  try {
    const cacheKey = JSON.stringify({
      code,
      inputs: input.items.map(item => item.json)
    });
    
    return resultCache.get(cacheKey);
  } catch (error) {
    console.warn('Cache check error:', error);
    return null;
  }
}

/**
 * Updates the result cache
 */
function updateCache(code: string, input: NodeExecutionData, resultItems: WorkflowItem[]): void {
  const cacheKey = JSON.stringify({
    code,
    inputs: input.items.map(item => item?.json || {})
  });
  
  // Store as a deep copy to prevent reference issues
  resultCache.set(cacheKey, { 
    items: JSON.parse(JSON.stringify(resultItems))
  });
  
  // Limit cache size to prevent memory issues
  if (resultCache.size > 100) {
    // Delete oldest entry
    const firstKey = resultCache.keys().next().value;
    if (firstKey) resultCache.delete(firstKey);
  }
}

/**
 * Compiles the user's function code into an executable function
 */
function compileUserFunction(code: string, useAsync: boolean): Function {
  try {
    // Prepare the function wrapper based on whether it's async or not
    const functionWrapper = useAsync
      ? `
        ${code}
        // Simple validation
        if (typeof process !== 'function') {
          throw new Error('Process function is not defined');
        }
        // For async mode, we always return a promise (handled by the async IIFE wrapper)
        return process(input, data);
      `
      : `
        ${code}
        if (typeof process !== 'function') {
          throw new Error('Process function is not defined');
        }
        return process(input, data);
      `;
    
    // Create the function with safety precautions and data parameter
    // For async function, we need to wrap it in an async IIFE
    const functionTemplate = useAsync
      ? `
      return (async function() {
        try {
          ${functionWrapper}
        } catch (error) {
          return { __error__: true, message: error.message, stack: error.stack };
        }
      })();
      `
      : `
      try {
        ${functionWrapper}
      } catch (error) {
        return { __error__: true, message: error.message, stack: error.stack };
      }
      `;
      
    // Support both 'input' and '$input' variables for compatibility
    return new Function('input', '$input', 'data', `
      // Make input available as both 'input' and '$input' for compatibility
      $input = input; 
      ${functionTemplate}
    `);
  } catch (error: any) {
    throw new Error(`Failed to compile function: ${error.message}`);
  }
}

/**
 * Process an item with timeout protection
 */
async function processWithTimeout(
  processFunction: Function,
  item: WorkflowItem,
  data: Record<string, any>,
  timeout: number,
  errorHandling: string
): Promise<WorkflowItem> {
  return new Promise((resolve) => {
    // Create timeout
    const timeoutId = setTimeout(() => {
      const errorMessage = `Function execution timed out after ${timeout}ms`;
      if (errorHandling === 'return') {
        resolve({
          json: { error: true, message: errorMessage },
          text: `Error: ${errorMessage}`
        });
      } else if (errorHandling === 'null') {
        resolve({
          json: null,
          text: `Error handled as null: ${errorMessage}`
        });
      } else {
        resolve({
          json: { error: true, message: errorMessage },
          text: `Error: ${errorMessage}`
        });
      }
    }, timeout);
    
    try {
      // Execute the function - wrap in Promise.resolve to handle both async and sync functions
      // Pass the same value as both input and $input for compatibility
      Promise.resolve(processFunction(item.json, item.json, data))
        .then(result => {
          // Clear timeout and resolve with result
          clearTimeout(timeoutId);
          
          if (result && result.__error__ === true) {
            // Function returned an error object
            const errorMessage = result.message || 'Unknown error in function execution';
            // In return mode, don't call handleError again as it already returns an error object
            if (errorHandling === 'return') {
              resolve({
                json: { error: true, message: errorMessage },
                text: `Error: ${errorMessage}`
              });
            } else if (errorHandling === 'null') {
              resolve({
                json: null,
                text: `Error handled as null: ${errorMessage}`
              });
            } else {
              // Default throw behavior
              resolve({
                json: { error: true, message: errorMessage },
                text: `Error: ${errorMessage}`
              });
            }
          } else {
            // Function executed successfully
            resolve({
              json: result,
              text: typeof result === 'object' ? JSON.stringify(result) : String(result)
            });
          }
        })
        .catch(execError => {
          // Execution error
          clearTimeout(timeoutId);
          const errorMessage = execError.message || 'Unknown execution error';
          
          if (errorHandling === 'return') {
            resolve({
              json: { error: true, message: errorMessage, stack: execError.stack },
              text: `Error: ${errorMessage}`
            });
          } else if (errorHandling === 'null') {
            resolve({
              json: null,
              text: `Error handled as null: ${errorMessage}`
            });
          } else {
            resolve({
              json: { error: true, message: errorMessage },
              text: `Error: ${errorMessage}`
            });
          }
        });
    } catch (syncError: any) {
      // Sync execution error
      clearTimeout(timeoutId);
      const errorMessage = syncError.message || 'Unknown synchronous error';
      
      if (errorHandling === 'return') {
        resolve({
          json: { error: true, message: errorMessage, stack: syncError.stack },
          text: `Error: ${errorMessage}`
        });
      } else if (errorHandling === 'null') {
        resolve({
          json: null,
          text: `Error handled as null: ${errorMessage}`
        });
      } else {
        resolve({
          json: { error: true, message: errorMessage },
          text: `Error: ${errorMessage}`
        });
      }
    }
  });
}

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<FunctionNodeData>('function_node', processNode);