/**
 * Workflow Runner Node Executor
 * 
 * Handles execution of another workflow within the current workflow.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';
import { apiRequest } from '@/lib/queryClient';

// Define configuration data interface for this node
export interface WorkflowRunnerNodeData {
  workflowId: number;     // ID of the workflow to run
  waitForResult: boolean; // Whether to wait for workflow execution to complete
  timeout: number;        // Timeout in milliseconds
  inputMapping: Record<string, string>; // Map node inputs to workflow inputs
}

// Default configuration for the node
export const defaultData: WorkflowRunnerNodeData = {
  workflowId: 0,
  waitForResult: true,
  timeout: 30000,
  inputMapping: {}
};

/**
 * Execute the Workflow Runner node
 */
export const execute = async (
  data: WorkflowRunnerNodeData, 
  inputs: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    const startTime = new Date();
    
    // Validate inputs
    if (!data.workflowId) {
      return createErrorOutput('Workflow ID is required');
    }

    // Prepare input data for the target workflow, mapping inputs according to configuration
    const workflowInputs = {};
    if (data.inputMapping) {
      for (const [targetKey, sourceKey] of Object.entries(data.inputMapping)) {
        if (inputs[sourceKey] !== undefined) {
          workflowInputs[targetKey] = inputs[sourceKey];
        }
      }
    }

    // If no specific mapping, use the primary input
    if (Object.keys(workflowInputs).length === 0 && inputs.input !== undefined) {
      workflowInputs['input'] = inputs.input;
    }

    // Call API to execute the workflow
    try {
      const response = await apiRequest({
        url: `/api/workflows/${data.workflowId}/execute`,
        method: 'POST',
        data: {
          inputs: workflowInputs,
          waitForResult: data.waitForResult,
          timeout: data.timeout
        }
      });

      if (response.error) {
        return createErrorOutput(`Error executing workflow: ${response.error}`);
      }

      // Return workflow execution result
      return createNodeOutput(
        {
          result: response.result || response,
          executionId: response.executionId || null,
          timestamp: new Date().toISOString()
        }, 
        { startTime }
      );
    } catch (error) {
      console.error('Workflow execution error:', error);
      return createErrorOutput(`Error executing workflow: ${error.message || 'Unknown error'}`);
    }
  } catch (error: unknown) {
    console.error('Workflow runner error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error in workflow runner';
    return createErrorOutput(`Workflow runner error: ${errorMessage}`);
  }
};