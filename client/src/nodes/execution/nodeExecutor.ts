/**
 * Node Executor
 * 
 * This module provides the core execution logic for nodes.
 * It handles the setup, execution, and error handling for node execution.
 */

import { NodeExecutionData } from '@/lib/types/workflow';
import { getNodeExecutor } from '../registry/nodeRegistry';
import { createErrorOutput } from './nodeOutputUtils';

/**
 * Execute a node with the given data and inputs
 */
export async function executeNode(
  nodeType: string,
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, NodeExecutionData>> {
  // Get the executor from the registry
  const executor = getNodeExecutor(nodeType);
  
  if (!executor) {
    return {
      error: createErrorOutput(`Node type '${nodeType}' not found or has no executor`, 'node-executor')
    };
  }
  
  try {
    // Execute the node
    const startTime = new Date();
    console.log(`Executing node ${nodeType} with inputs:`, inputs);
    
    // Add execution metadata to the node data
    const executionData = {
      ...nodeData,
      _execution: {
        startTime,
        nodeType
      }
    };
    
    // Execute the node with the executor
    const result = await executor.execute(executionData, inputs);
    
    const endTime = new Date();
    console.log(`Node ${nodeType} executed in ${endTime.getTime() - startTime.getTime()}ms`);
    
    return result;
  } catch (error) {
    console.error(`Error executing node ${nodeType}:`, error);
    
    // Return a standardized error output
    return {
      error: createErrorOutput(
        `Error executing node: ${error instanceof Error ? error.message : String(error)}`,
        `node-executor:${nodeType}`
      )
    };
  }
}

/**
 * Execute a node in isolation with test inputs
 * Used for debugging and testing nodes
 */
export async function executeNodeForTesting(
  nodeType: string,
  nodeData: Record<string, any>,
  testInputs: Record<string, any>
): Promise<{
  success: boolean;
  outputs?: Record<string, NodeExecutionData>;
  error?: string;
  executionTime?: number;
}> {
  const startTime = new Date();
  
  try {
    // Convert test inputs to the expected format
    const formattedInputs: Record<string, NodeExecutionData> = {};
    
    for (const key in testInputs) {
      formattedInputs[key] = {
        items: [{ json: testInputs[key] }],
        meta: { isTestInput: true }
      };
    }
    
    // Execute the node
    const result = await executeNode(nodeType, nodeData, formattedInputs);
    
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    
    // Check for errors in the result
    const errorOutput = Object.values(result).find(output => output.meta?.error);
    
    if (errorOutput) {
      return {
        success: false,
        error: errorOutput.meta?.errorMessage || 'Unknown error during execution',
        outputs: result,
        executionTime
      };
    }
    
    return {
      success: true,
      outputs: result,
      executionTime
    };
  } catch (error) {
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    };
  }
}