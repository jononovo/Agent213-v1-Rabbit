/**
 * Enhanced Function Node Executor
 * 
 * This file handles the execution logic for the function_node
 * which allows users to run custom JavaScript functions within workflows.
 * 
 * Features:
 * - Advanced error handling
 * - Improved performance with optional result caching
 * - Support for multiple execution environments
 * - Template-based code generation
 * - Timeout protection
 */

// Define interfaces needed to avoid import issues
interface WorkflowItem {
  json: any;              // The actual data
  text?: string;          // Text representation
  binary?: {              // For binary data (images, files, etc.)
    mimeType: string;
    data: string;
    filename?: string;
  };
}

interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;           // When execution started
    endTime: Date;             // When execution completed
    source?: string;           // Source node identifier
    error?: boolean;           // Whether execution resulted in an error
    errorMessage?: string;     // Error message if error is true
    warning?: string;          // Non-critical warning message
    [key: string]: any;        // Additional metadata properties
  };
}

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

/**
 * Execute a JavaScript function node with the provided input
 */
export async function execute(
  nodeData: FunctionNodeData,
  input: NodeExecutionData
): Promise<NodeExecutionData> {
  const startTime = new Date();
  const meta = {
    startTime,
    endTime: new Date(),
    source: 'function_node',
    error: false,
    errorMessage: '',
    cached: false
  };
  
  try {
    // Extract settings from node data with defaults
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
    const code = nodeData.code || defaultCode;
    const useAsyncFunction = nodeData.useAsyncFunction !== false;
    const timeout = nodeData.timeout || 5000;
    const errorHandling = nodeData.errorHandling || 'throw';
    const cacheResults = nodeData.cacheResults === true;
    const executionEnvironment = nodeData.executionEnvironment || 'client';
    
    // Server-side execution not implemented yet, log a warning
    if (executionEnvironment === 'server') {
      console.warn('Server-side execution not fully implemented yet, falling back to client-side');
    }
    
    // Check cache for identical inputs if caching is enabled
    if (cacheResults) {
      const cacheKey = JSON.stringify({
        code,
        inputs: input.items.map(item => item.json)
      });
      
      const cachedResult = resultCache.get(cacheKey);
      if (cachedResult) {
        return {
          items: cachedResult.items,
          meta: {
            ...cachedResult.meta,
            cached: true,
            startTime,
            endTime: new Date()
          }
        };
      }
    }
    
    // Create a function from the code string
    let processFunction;
    
    try {
      // Prepare the function wrapper based on whether it's async or not
      const functionWrapper = useAsyncFunction
        ? `
          ${code}
          // Make sure we're calling an async function
          if (typeof process !== 'function') {
            throw new Error('Process function is not defined');
          }
          // Check if process is async
          if (process.constructor.name === 'AsyncFunction') {
            return await process(input, data);
          } else {
            // If not async but useAsyncFunction is true, wrap in Promise.resolve
            return Promise.resolve(process(input, data));
          }
        `
        : `
          ${code}
          if (typeof process !== 'function') {
            throw new Error('Process function is not defined');
          }
          return process(input, data);
        `;
      
      // Create the function with safety precautions and data parameter
      processFunction = new Function('input', 'data', `
        try {
          ${functionWrapper}
        } catch (error) {
          return { __error__: true, message: error.message, stack: error.stack };
        }
      `);
    } catch (codeError: any) {
      return {
        items: input.items,
        meta: {
          ...meta,
          endTime: new Date(),
          error: true,
          errorMessage: `Failed to compile function: ${codeError.message}`
        }
      };
    }
    
    // Process each item with the function
    const resultItems: WorkflowItem[] = [];
    
    // Process with timeout protection
    const processWithTimeout = async (item: WorkflowItem, data: Record<string, any>): Promise<WorkflowItem> => {
      return new Promise((resolve) => {
        // Create timeout
        const timeoutId = setTimeout(() => {
          resolve({
            json: handleError(new Error(`Function execution timed out after ${timeout}ms`)),
            text: `Execution timed out after ${timeout}ms`
          });
        }, timeout);
        
        // Handle errors according to configuration
        const handleError = (error: Error) => {
          switch (errorHandling) {
            case 'return':
              return { error: true, message: error.message, stack: error.stack };
            case 'null':
              return null;
            case 'throw':
            default:
              throw error;
          }
        };
        
        try {
          // Execute the function - wrap in Promise.resolve to handle both async and sync functions
          Promise.resolve(processFunction(item.json, data))
            .then(result => {
              // Clear timeout and resolve with result
              clearTimeout(timeoutId);
              
              if (result && result.__error__ === true) {
                // Function returned an error object
                resolve({
                  json: handleError(new Error(result.message)),
                  text: `Error: ${result.message}`
                });
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
              resolve({
                json: handleError(execError),
                text: `Error: ${execError.message}`
              });
            });
        } catch (syncError: any) {
          // Sync execution error
          clearTimeout(timeoutId);
          resolve({
            json: handleError(syncError),
            text: `Error: ${syncError.message}`
          });
        }
      });
    };
    
    // Process all input items
    const additionalData: Record<string, any> = {
      items: input.items.map(item => item.json),
      timestamp: new Date().toISOString(),
      nodeId: meta.source,
      environment: executionEnvironment
    };
    
    for (const item of input.items) {
      const result = await processWithTimeout(item, additionalData);
      resultItems.push(result);
    }
    
    // Check if any items resulted in errors
    const hasErrors = resultItems.some(item => 
      item.json && typeof item.json === 'object' && item.json.error === true
    );
    
    // Return the processed items
    const executionResult = {
      items: resultItems,
      meta: {
        ...meta,
        endTime: new Date(),
        error: hasErrors,
        errorMessage: hasErrors 
          ? 'One or more items failed during processing' 
          : ''
      }
    };
    
    // Store in cache if caching is enabled
    if (cacheResults && !hasErrors) {
      const cacheKey = JSON.stringify({
        code,
        inputs: input.items.map(item => item.json)
      });
      
      resultCache.set(cacheKey, JSON.parse(JSON.stringify(executionResult)));
      
      // Limit cache size to prevent memory issues
      if (resultCache.size > 100) {
        // Delete oldest entry - crude but simple approach
        const firstKey = resultCache.keys().next().value;
        if (firstKey) resultCache.delete(firstKey);
      }
    }
    
    return executionResult;
  } catch (error: any) {
    // Catch any unexpected errors in the executor itself
    return {
      items: input.items.map((item: WorkflowItem) => ({
        json: { error: true, message: error.message },
        text: `Error: ${error.message}`
      })),
      meta: {
        ...meta,
        endTime: new Date(),
        error: true,
        errorMessage: `Executor error: ${error.message}`
      }
    };
  }
}