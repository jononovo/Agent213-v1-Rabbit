/**
 * Toggle Switch Node Executor
 * 
 * This file contains the logic for executing the toggle switch node.
 * It provides boolean state and condition string outputs.
 */

import { createNodeOutput, createErrorOutput } from '../../nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

export interface ToggleSwitchNodeData {
  toggleState: boolean;
  trueLabel: string;
  falseLabel: string;
}

export const execute = async (
  nodeData: ToggleSwitchNodeData,
  inputs?: any
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Get the toggle state (from inputs if available, otherwise from node data)
    let toggleState = nodeData.toggleState;
    
    // Check if there's an override from inputs
    if (inputs && 'state' in inputs) {
      if (typeof inputs.state === 'boolean') {
        toggleState = inputs.state;
      } else if (
        typeof inputs.state === 'string' && 
        (inputs.state.toLowerCase() === 'true' || inputs.state.toLowerCase() === 'false')
      ) {
        toggleState = inputs.state.toLowerCase() === 'true';
      } else if (typeof inputs.state === 'number') {
        toggleState = inputs.state !== 0;
      }
    }
    
    // Use labels from node data if available
    const trueLabel = nodeData.trueLabel || 'On';
    const falseLabel = nodeData.falseLabel || 'Off';
    
    // Create the output object
    const output = {
      boolean: toggleState,
      condition: toggleState ? trueLabel : falseLabel
    };
    
    return createNodeOutput(output, {
      startTime,
      additionalMeta: {
        toggleState,
        trueLabel,
        falseLabel
      }
    });
  } catch (error: any) {
    console.error('Error in toggle_switch executor:', error);
    return createErrorOutput(
      error.message || 'Error processing toggle switch',
      'toggle_switch'
    );
  }
};