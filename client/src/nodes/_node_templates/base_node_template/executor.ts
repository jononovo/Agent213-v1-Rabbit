/**
 * Base Node Template Executor
 * 
 * This is a minimal implementation of a node executor.
 * 
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 */

import { NodeExecutionData } from '@/nodes/core/types/nodeExecutionTypes';
import { createNodeExecutor } from '@/nodes/core/base/NodeExecutorBase';
import { BaseNodeTemplateData, defaultData } from './definition';

// Re-export the default data for use in UI
export { defaultData };
export type { BaseNodeTemplateData };

/**
 * Process the base node template
 * Implements the core logic for this node type
 */
async function processNode(
  nodeData: BaseNodeTemplateData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // Get input data (if any)
  const inputData = inputs.input?.items[0]?.json;
  
  // Add your custom execution logic here
  const result = inputData || { message: 'No input data received' };
  
  // Return the result - BaseExecutor will format this into standardized output
  return {
    output: result,
    info: {
      processed: true,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<BaseNodeTemplateData>('base_node_template', processNode);