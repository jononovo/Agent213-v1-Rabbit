/**
 * Node Executor Base
 * 
 * Provides standardized utilities for node executors while maintaining
 * the function-based pattern used throughout the application.
 * 
 * This module ensures all nodes produce consistent outputs without
 * requiring significant changes to the existing code structure.
 */

import { NodeExecutionData } from '../types/nodeExecutionTypes';

/**
 * Options for creating node output
 */
export interface OutputOptions {
  startTime: Date;
  source?: string;
  additionalMeta?: Record<string, any>;
}

/**
 * Creates a standardized successful node output
 */
export function createOutput(
  data: Record<string, any>,
  options: OutputOptions
): NodeExecutionData {
  const { startTime, source = 'node', additionalMeta = {} } = options;
  const endTime = new Date();
  
  // Convert data to array of workflow items
  const items = Object.entries(data).map(([key, value]) => {
    return {
      json: value,
      text: typeof value === 'string' ? value : JSON.stringify(value),
      _key: key
    };
  });
  
  // Return standardized output
  return {
    items,
    meta: {
      startTime,
      endTime,
      executionTime: endTime.getTime() - startTime.getTime(),
      source,
      ...additionalMeta
    }
  };
}

/**
 * Creates a standardized error output
 */
export function createError(
  errorMessage: string,
  source: string = 'node'
): NodeExecutionData {
  const startTime = new Date();
  const endTime = new Date();
  
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

/**
 * Standard node executor wrapper template
 * 
 * This function provides the structure for all node executors to follow,
 * ensuring consistent input handling, error management, and output formatting.
 */
export function createNodeExecutor(
  nodeType: string,
  executionFn: (nodeData: any, inputs?: Record<string, any>) => Promise<any>
) {
  // Return a standard executor function
  return async (
    nodeData: any,
    inputs?: Record<string, any>
  ): Promise<NodeExecutionData> => {
    const startTime = new Date();
    
    try {
      // Call the node-specific execution function
      const result = await executionFn(nodeData, inputs);
      
      // If result is already in NodeExecutionData format, return it directly
      if (result && result.items && result.meta) {
        return result;
      }
      
      // Otherwise, convert to standard format
      return createOutput(
        // If result is not an object with keys, wrap it
        typeof result === 'object' && result !== null ? 
          result : 
          { result },
        { 
          startTime,
          source: nodeType
        }
      );
    } catch (error: any) {
      // Handle errors consistently
      return createError(
        error.message || 'Unknown error during node execution',
        nodeType
      );
    }
  };
}

// Export the utility functions directly
export default {
  createOutput,
  createError,
  createNodeExecutor
};