/**
 * Number Input Node Executor
 * 
 * This file contains the logic for executing the number input node.
 * It processes numeric input and provides both number and string outputs.
 */

import { createNodeOutput, createErrorOutput } from '../../nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

export interface NumberInputNodeData {
  min: number;
  max: number;
  step: number;
  inputValue: number;
  showSlider: boolean;
}

export const execute = async (
  nodeData: NumberInputNodeData,
  inputs?: any
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Get input value, either from direct inputs or from node data
    let value: number;
    
    if (inputs && typeof inputs.value === 'number') {
      // If there's a value in the inputs, use it
      value = inputs.value;
    } else if (inputs && typeof inputs.value === 'string' && !isNaN(parseFloat(inputs.value))) {
      // If there's a string value that can be parsed, use it
      value = parseFloat(inputs.value);
    } else {
      // Use the value from the node data
      value = nodeData.inputValue;
    }
    
    // Validate value is within range
    if (value < nodeData.min) {
      value = nodeData.min;
    } else if (value > nodeData.max) {
      value = nodeData.max;
    }
    
    // Create output with both numeric and string representations
    const output = {
      number: value,
      numberAsString: value.toString()
    };
    
    // Return standardized output
    return createNodeOutput(output, {
      startTime,
      additionalMeta: {
        min: nodeData.min,
        max: nodeData.max,
        step: nodeData.step
      }
    });
  } catch (error: any) {
    console.error('Error in number_input executor:', error);
    return createErrorOutput(
      error.message || 'Error processing number input',
      'number_input'
    );
  }
};