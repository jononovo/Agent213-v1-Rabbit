/**
 * Node Template - Executor
 * 
 * This is a template for creating new node executors.
 * Copy this file to create a new node and modify it to fit your needs.
 * 
 * This template follows the standardized BaseExecutor pattern which
 * is the single approach for all node executors in the system.
 */

import { NodeExecutionData } from '../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../core/base/NodeExecutorBase';

/**
 * Type definition for this node's specific data
 * Define strong types for your node's parameters
 */
interface NodeTemplateData {
  parameter1?: string;
  parameter2?: number;
  parameter3?: boolean;
  // Add other parameters specific to this node
}

/**
 * The process function implements the node's core logic
 * 
 * This function is wrapped by the BaseExecutor which handles:
 * - Standard output formatting
 * - Error handling
 * - Performance tracking
 */
async function processNode(
  nodeData: NodeTemplateData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  console.log('Processing NodeTemplate with data:', nodeData);
  
  // Extract input data from connected nodes
  const input1 = inputs.input1?.items[0]?.json || 'No input provided';
  const input2 = inputs.input2?.items[0]?.json || 0;
  
  // Use node parameters with defaults
  const parameter1 = nodeData.parameter1 || 'default';
  const parameter2 = nodeData.parameter2 || 42;
  const parameter3 = nodeData.parameter3 !== undefined ? nodeData.parameter3 : true;
  
  // Implement the node's specific business logic
  const result1 = `Processed: ${input1} with ${parameter1}`;
  const result2 = { 
    value: Number(input2) * parameter2,
    enableOption: parameter3,
    timestamp: new Date().toISOString()
  };
  
  // Return results - BaseExecutor will convert this to the standardized output format
  return {
    output1: result1,
    output2: result2
  };
}

/**
 * Export the standardized execute function
 * 
 * All nodes must use this pattern to ensure consistent formatting
 * across the entire workflow system.
 */
export const execute = createNodeExecutor<NodeTemplateData>('NodeTemplate', processNode);