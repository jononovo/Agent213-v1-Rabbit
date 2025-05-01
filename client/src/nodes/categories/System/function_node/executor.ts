/**
 * DEBUG VERSION - Function Node Executor
 * 
 * This is a heavily simplified version focusing on debugging
 * the executor loading and execution path.
 */

import { NodeExecutionData, WorkflowItem } from '../../../core/types/nodeExecutionTypes';

// Direct execute function - skipping the factory pattern for maximum simplicity
export async function execute(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  console.log('===========================================');
  console.log('DEBUG: Function Node Executor Was Called!');
  console.log('DEBUG: Node Data:', JSON.stringify(nodeData, null, 2));
  console.log('DEBUG: Inputs:', JSON.stringify(inputs, null, 2));
  console.log('===========================================');
  
  const startTime = new Date();
  
  try {
    // Create a simple response for debugging purposes
    const result = {
      success: true,
      message: "Debug function node executed successfully",
      timestamp: startTime.toISOString(),
      inputDetails: {
        hasInputs: Object.keys(inputs).length > 0,
        inputKeys: Object.keys(inputs),
        firstInputItems: inputs[Object.keys(inputs)[0]]?.items?.length || 0
      }
    };
    
    console.log('DEBUG: Function node result:', result);
    
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
        source: 'function_node_debug_version'
      }
    };
  } catch (error: any) {
    console.error('DEBUG: Function node error:', error);
    
    return {
      items: [
        {
          json: { 
            error: true, 
            message: error.message || 'Unknown error in debug function node',
            stack: error.stack 
          },
          text: `Error: ${error.message || 'Unknown error'}`
        }
      ],
      meta: {
        startTime,
        endTime: new Date(),
        error: true,
        source: 'function_node_debug_version'
      }
    };
  }
}