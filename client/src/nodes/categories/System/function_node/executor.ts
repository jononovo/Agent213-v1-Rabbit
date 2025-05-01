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
  settings?: {
    code?: string;
  };
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
    // Get the input data with better deep inspection
    let inputData = null;
    
    // Try to find the actual data across multiple possible locations
    const firstInputKey = Object.keys(inputs)[0];
    
    // First try the standard path for function node inputs
    if (firstInputKey && inputs[firstInputKey]?.items?.[0]?.json) {
      inputData = inputs[firstInputKey].items[0].json;
      console.log("Found input at first level");
    } 
    // For webhook data, often the actual request body is in the body property
    else if (firstInputKey && inputs[firstInputKey]?.items?.[0]?.json?.body) {
      inputData = inputs[firstInputKey].items[0].json.body;
      console.log("Found input in body property");
    }
    
    // Essential for the 5 Ducks integration: we must preserve the searchId
    // Log all available data to ensure we can find the searchId
    console.log("Found input data with keys:", Object.keys(inputData || {}));
    
    // Specifically check for searchId in various places in case it's nested
    if (inputData && !inputData.searchId) {
      console.log("SearchId not found in primary location, checking alternate paths");
      
      // Try to extract from body if available
      if (inputs[firstInputKey]?.items?.[0]?.json?.body?.searchId) {
        inputData.searchId = inputs[firstInputKey].items[0].json.body.searchId;
        console.log("Found searchId in body property:", inputData.searchId);
      }
    }
    
    console.log(`Function node starting execution with input:`, inputData);
    
    let result;
    
    // Process custom function implementation if available - check both data and settings
    let functionCode = nodeData.code || nodeData.implementation;
    
    // Also try to get code from settings, which is where the UI stores it
    if (!functionCode && nodeData.settings && nodeData.settings.code) {
      functionCode = nodeData.settings.code;
    }
    
    console.log("Function code available:", !!functionCode);
    if (functionCode) {
      console.log("Function code type:", typeof functionCode);
      console.log("Function code length:", functionCode.length);
      console.log("Function code snippet:", functionCode.substring(0, 100) + "...");
    }
    
    if (functionCode && typeof functionCode === 'string') {
      try {
        // Get the settings to check if code exists
        console.log("Full function node data:", JSON.stringify(nodeData, null, 2));
        
        // Create a safe function from the code
        // First extract the function body
        const functionBodyMatch = functionCode.match(/function\s+process\s*\([^)]*\)\s*{([\s\S]*)}/);
        console.log("Function body match:", !!functionBodyMatch);
        const functionBody = functionBodyMatch ? functionBodyMatch[1] : functionCode;
        
        // Create a safer, simpler way to execute the function code
        // eslint-disable-next-line no-new-func
        const processFunction = new Function('input', `
          // Define the process function directly from the provided code
          ${functionCode}
          
          // Call the process function with the input
          try {
            return process(input);
          } catch (error) {
            console.error("Error executing process function:", error);
            return { 
              error: error.message, 
              success: false 
            };
          }
        `);
        
        // Execute the function with the input data
        console.log(`Executing custom function with input:`, inputData);
        result = processFunction(inputData);
        console.log(`Function execution result:`, result);
        
        // We actually don't need to do anything special here.
        // Just ensure the data is passed through properly
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
// Log the result for debugging
function logExecutionResult(result: any) {
  console.log('FUNCTION NODE EXECUTION RESULT:');
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export const execute = createNodeExecutor<FunctionNodeData>('function_node', async (data, inputs) => {
  const result = await processNode(data, inputs);
  return logExecutionResult(result);
});