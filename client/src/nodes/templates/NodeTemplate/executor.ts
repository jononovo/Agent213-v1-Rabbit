/**
 * Node Template - Executor
 * 
 * This is a template for creating new node executors.
 * Copy this file to create a new node and modify it to fit your needs.
 * 
 * This template follows the standardized NodeExecutorBase pattern
 * for consistent output formatting across all nodes.
 */

import { NodeExecutionData } from '../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../core/base/NodeExecutorBase';

/**
 * The main execution function that implements the node's logic
 * 
 * @param nodeData - The data/parameters stored for this specific node instance
 * @param inputs - Data from connected input nodes
 */
async function processNode(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
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
  
  // Return results in a simple object format - NodeExecutorBase will standardize it
  return {
    output1: result1,
    output2: result2
  };
}

/**
 * Export the standardized execute function
 * 
 * This wraps our node-specific logic with the standardized executor base
 * that provides consistent input validation, error handling, and output formatting.
 */
export const execute = createNodeExecutor('NodeTemplate', processNode);