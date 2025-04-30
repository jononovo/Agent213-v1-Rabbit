/**
 * Node Output Utilities
 * 
 * This file provides utility functions for standardizing node execution outputs
 * and error handling across the node system.
 */

import { NodeExecutionData } from '@shared/nodeTypes';

interface OutputOptions {
  startTime: Date;
  additionalMeta?: Record<string, any>;
}

/**
 * Creates a standardized output for node execution
 */
export function createNodeOutput(
  data: Record<string, any>,
  options: OutputOptions
): NodeExecutionData {
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
 */
export function createErrorOutput(
  errorMessage: string,
  source: string = 'unknown'
): NodeExecutionData {
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