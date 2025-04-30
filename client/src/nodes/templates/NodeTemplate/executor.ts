/**
 * Node Template - Executor
 * 
 * This is a template for creating new node executors.
 * Copy this file to create a new node and modify it to fit your needs.
 */

import { NodeExecutionData, WorkflowItem } from '../../core/types/nodeExecutionTypes';

/**
 * Execute function - Runs the node's logic
 * 
 * @param nodeData - The data/parameters stored for this specific node instance
 * @param inputs - Data from connected input nodes
 * @returns Promise resolving to the node's output(s)
 */
export async function execute(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData>
): Promise<NodeExecutionData> {
  // Default response
  const response: NodeExecutionData = {
    items: [],
    meta: {
      startTime: new Date(),
      endTime: new Date()
    }
  };
  
  try {
    console.log('Executing NodeTemplate with data:', nodeData);
    
    // Get input data - access it from the 'inputs' parameter
    const input1 = inputs.input1?.items[0]?.json || 'No input provided';
    const input2 = inputs.input2?.items[0]?.json || 0;
    
    // Use the node's parameters - access from 'nodeData'
    const parameter1 = nodeData.parameter1 || 'default';
    const parameter2 = nodeData.parameter2 || 42;
    const parameter3 = nodeData.parameter3 !== undefined ? nodeData.parameter3 : true;
    
    // Your node's business logic goes here
    const result1 = `Processed: ${input1} with ${parameter1}`;
    const result2 = { 
      value: Number(input2) * parameter2,
      enableOption: parameter3,
      timestamp: new Date().toISOString()
    };
    
    // Create workflow items for output
    const outputItem1: WorkflowItem = {
      json: result1,
      meta: {
        source: 'NodeTemplate',
        outputType: 'output1'
      }
    };
    
    const outputItem2: WorkflowItem = {
      json: result2,
      meta: {
        source: 'NodeTemplate',
        outputType: 'output2'
      }
    };
    
    // Add output items
    response.items = [outputItem1, outputItem2];
    
    // Add any metadata about execution
    response.meta.endTime = new Date();
    
    return response;
  } catch (error) {
    console.error('Error executing NodeTemplate:', error);
    
    // Return the error in a standardized format
    response.items = [{
      json: { error: error instanceof Error ? error.message : String(error) }
    }];
    
    response.meta.error = true;
    response.meta.endTime = new Date();
    
    return response;
  }
}