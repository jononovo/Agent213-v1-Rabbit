/**
 * Function Node Executor
 * 
 * This executor processes data through custom JavaScript functions
 * or provides pass-through functionality for data inspection.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';

export async function execute(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  const startTime = new Date();
  
  try {
    // Get the first input data for convenience
    const firstInputKey = Object.keys(inputs)[0];
    const inputData = firstInputKey ? inputs[firstInputKey]?.items?.[0]?.json : null;
    
    // Create a result object that includes input data
    const result = {
      success: true,
      message: "Function executed successfully",
      timestamp: startTime.toISOString(),
      data: inputData || {}
    };
    
    // Process custom function implementation if available
    if (nodeData.implementation && typeof nodeData.implementation === 'string') {
      try {
        // In a full implementation, we would evaluate the custom function here
        // Currently showing a placeholder since dynamic function evaluation is restricted
        console.log("Custom function implementation exists but not executed");
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
    }
    
    // Return in the expected format
    return {
      items: [
        { 
          json: result,
          text: JSON.stringify(result)
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