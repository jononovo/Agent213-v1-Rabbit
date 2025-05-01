/**
 * Node Output Utilities - DEPRECATED
 * 
 * This file provides utility functions for standardizing node execution outputs
 * and error handling across the node system.
 * 
 * ⚠️ DEPRECATION NOTICE ⚠️
 * These utilities are deprecated and will be removed in a future version.
 * Use the BaseExecutor pattern from client/src/nodes/core/base/NodeExecutorBase.ts instead.
 * 
 * Example:
 * ```typescript
 * import { createNodeExecutor } from '../../core/base/NodeExecutorBase';
 * 
 * // Define your node data interface
 * interface YourNodeData {
 *   // Node data properties
 * }
 * 
 * // Implement node-specific logic
 * async function processNode(
 *   nodeData: YourNodeData,
 *   inputs?: Record<string, NodeExecutionData>
 * ): Promise<Record<string, any>> {
 *   // Your code here
 *   return { output: result };
 * }
 * 
 * // Export using the standardized wrapper
 * export const execute = createNodeExecutor<YourNodeData>('your_node_type', processNode);
 * ```
 * 
 * @deprecated Use BaseExecutor pattern instead
 */

import { NodeExecutionData } from '@shared/nodeTypes';

interface OutputOptions {
  startTime: Date;
  additionalMeta?: Record<string, any>;
}

/**
 * Creates a standardized output for node execution
 * 
 * @deprecated Use BaseExecutor pattern instead via createNodeExecutor from NodeExecutorBase.ts
 */
export function createNodeOutput(
  data: Record<string, any>,
  options: OutputOptions
): NodeExecutionData {
  console.warn('⚠️ Deprecated: createNodeOutput is deprecated and will be removed in a future version. Use the BaseExecutor pattern instead.');
  
  const { startTime, additionalMeta = {} } = options;
  const endTime = new Date();
  
  // Convert data to WorkflowItems
  const items = Object.entries(data).map(([key, value]) => {
    // Create a standard WorkflowItem for each output
    return {
      json: value,
      text: typeof value === 'string' ? value : JSON.stringify(value),
      // binary field is undefined if not provided
      _key: key
    };
  });
  
  // Return the standardized NodeExecutionData
  return {
    items,
    meta: {
      startTime,
      endTime,
      executionTime: endTime.getTime() - startTime.getTime(),
      ...additionalMeta
    }
  };
}

/**
 * Creates a standardized error output for node execution
 * 
 * @deprecated Use BaseExecutor pattern instead via createNodeExecutor from NodeExecutorBase.ts
 */
export function createErrorOutput(
  errorMessage: string,
  source: string = 'unknown'
): NodeExecutionData {
  console.warn('⚠️ Deprecated: createErrorOutput is deprecated and will be removed in a future version. Use the BaseExecutor pattern instead.');
  
  const startTime = new Date();
  const endTime = new Date();
  
  // Return a standardized error format
  return {
    items: [],
    meta: {
      startTime,
      endTime,
      executionTime: endTime.getTime() - startTime.getTime(),
      error: true,
      errorMessage,
      source
    }
  };
}