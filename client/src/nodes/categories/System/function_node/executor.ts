/**
 * Function Node Executor
 * 
 * This executor processes data through custom JavaScript functions
 * or provides pass-through functionality for data inspection.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';

interface FunctionNodeData {
  code?: string;
  implementation?: string;
}

/**
 * Process a function node
 */
async function processNode(
  nodeData: FunctionNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  const startTime = new Date();
  
  try {
    // Get the first input data for convenience
    const firstInputKey = Object.keys(inputs)[0];
    const inputData = firstInputKey ? inputs[firstInputKey]?.items?.[0]?.json : null;
    
    console.log(`Function node starting execution with input:`, inputData);
    
    let result;
    
    // Process custom function implementation if available
    const functionCode = nodeData.code || nodeData.implementation;
    
    if (functionCode && typeof functionCode === 'string') {
      try {
        // Create a safe function from the code
        // First extract the function body
        const functionBodyMatch = functionCode.match(/function\s+process\s*\([^)]*\)\s*{([\s\S]*)}/);
        const functionBody = functionBodyMatch ? functionBodyMatch[1] : functionCode;
        
        // Create a function that takes the input and executes the code
        // eslint-disable-next-line no-new-func
        const processFunction = new Function('input', `
          try {
            ${functionBody}
          } catch (error) {
            return { error: error.message, success: false };
          }
        `);
        
        // Execute the function with the input data
        console.log(`Executing custom function with input:`, inputData);
        result = processFunction(inputData);
        console.log(`Function execution result:`, result);
      } catch (functionError: any) {
        console.error("Error executing custom function:", functionError);
        return {
          items: [
            {
              json: { 
                success: false,
                error: functionError.message,
                timestamp: startTime.toISOString()
              },
              text: `Error: ${functionError.message}`
            }
          ],
          meta: {
            startTime,
            endTime: new Date(),
            error: true,
            source: 'function_node'
          }
        };
      }
    } else {
      // Default pass-through behavior if no code provided
      result = {
        success: true,
        message: "Function executed successfully (pass-through mode)",
        timestamp: startTime.toISOString(),
        data: inputData || {}
      };
    }
    
    // Return in the expected format
    return {
      items: [
        { 
          json: result,
          text: typeof result === 'string' ? result : JSON.stringify(result)
        }
      ],
      meta: {
        startTime,
        endTime: new Date(),
        source: 'function_node'
      }
    };
  } catch (error: any) {
    // Handle unexpected errors
    console.error("Unexpected error in function node:", error);
    return {
      items: [
        {
          json: { 
            success: false, 
            message: error.message || 'Unknown error in function node',
            error: true
          },
          text: `Error: ${error.message || 'Unknown error'}`
        }
      ],
      meta: {
        startTime,
        endTime: new Date(),
        error: true,
        source: 'function_node'
      }
    };
  }
}

/**
 * Export the standardized execute function
 */
export const execute = createNodeExecutor<FunctionNodeData>('function_node', processNode);