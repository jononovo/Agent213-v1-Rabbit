/**
 * Workflow Output Node Executor
 * 
 * This file handles the execution logic for the workflow_output node,
 * which captures and returns workflow output.
 */

import { createNodeOutput } from '../../nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

// Define the node data interface
interface WorkflowOutputNodeData {
  formatOutput: boolean;
  includeMetadata: boolean;
}

/**
 * Execute function for the workflow output node
 * This captures and returns the workflow output
 */
export const execute = async (
  nodeData: WorkflowOutputNodeData,
  inputs: Record<string, NodeExecutionData>
): Promise<any> => {
  const startTime = new Date();
  
  try {
    // Get input data
    const inputData = inputs.input?.items?.[0]?.json || inputs.input?.items?.[0]?.text || {};
    
    // Extract settings
    const {
      formatOutput = true,
      includeMetadata = true
    } = nodeData;
    
    // Process output based on settings
    let output = inputData;
    
    // Apply formatting if enabled
    if (formatOutput && typeof output === 'string') {
      try {
        // Try to parse as JSON if it's a string that looks like JSON
        if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
          output = JSON.parse(output);
        }
      } catch (error) {
        // If parsing fails, keep the original string
        console.log('Output parsing failed, keeping as string:', error);
      }
    }
    
    // Metadata to include
    const outputMeta = {
      startTime,
      endTime: new Date(),
      outputCaptured: true
    };
    
    // Return the output
    return createNodeOutput(
      output,
      {
        startTime,
        additionalMeta: includeMetadata ? outputMeta : undefined
      }
    );
  } catch (error: any) {
    console.error('Error in workflow_output executor:', error);
    
    // Return the error
    return createNodeOutput(
      { error: error.message || 'Error processing workflow output' },
      {
        startTime,
        error: true,
        errorMessage: error.message || 'Error processing workflow output'
      }
    );
  }
};