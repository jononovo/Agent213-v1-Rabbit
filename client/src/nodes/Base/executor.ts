/**
 * Default Node Executor
 * 
 * This file defines the execution logic for the default node type.
 * It simply passes through input data to the output.
 */

import { NodeExecutionData, WorkflowItem } from '../../../shared/nodeTypes';

/**
 * Execute the default node
 * @param inputs Node input data
 * @param params Node parameters
 * @returns Node output data
 */
export async function executeDefaultNode(
  inputs: Record<string, NodeExecutionData>,
  params: Record<string, any>
): Promise<Record<string, NodeExecutionData>> {
  const startTime = new Date();
  
  // Get the input data
  const inputData = inputs.input?.items || [];
  
  // For a default node, we just pass through the data
  const items: WorkflowItem[] = inputData.map((item: WorkflowItem) => ({
    ...item
  }));
  
  const endTime = new Date();
  
  // Return the data as output
  return {
    output: {
      items,
      meta: {
        startTime,
        endTime,
        source: 'default'
      }
    }
  };
}