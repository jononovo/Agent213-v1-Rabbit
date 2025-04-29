/**
 * Base Node Template Executor
 * 
 * This is a minimal implementation of a node executor.
 * Replace this comment with a description of your node's execution logic.
 */

import { NodeExecutor } from '@/types';
import { BaseNodeTemplateData, defaultData } from './definition';

// Re-export the default data for use in UI
export { defaultData };
export type { BaseNodeTemplateData };

// Node executor function
export const executor: NodeExecutor<BaseNodeTemplateData> = async (node, inputs) => {
  try {
    // Get input data (if any)
    const inputData = inputs.input?.[0]?.json;
    
    // Add your custom execution logic here
    const result = inputData || { message: 'No input data received' };
    
    // Return the execution result
    return {
      output: [{ json: result }]
    };
  } catch (error) {
    // Handle errors
    console.error('Base node template execution error:', error);
    throw new Error(`Execution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};