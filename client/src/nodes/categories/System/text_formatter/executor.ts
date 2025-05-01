/**
 * Text Formatter Node Executor
 * 
 * This is the execution logic for the Text Formatter node.
 * 
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';
import { TextFormatterData, defaultData } from './definition';

// Re-export the default data for use in UI
export { defaultData };
export type { TextFormatterData };

/**
 * Format text according to the specified operation
 */
function formatText(text: string, operation: string): string {
  switch (operation) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
      // Title case: capitalize first letter of each word
      return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case 'trim':
      return text.trim();
    case 'reverse':
      return text.split('').reverse().join('');
    default:
      return text;
  }
}

/**
 * Process the text formatter node
 * Implements the core logic for this node type
 */
async function processNode(
  nodeData: TextFormatterData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // Get the input text
  const inputData = inputs.text?.items?.[0]?.json;
  
  // Handle case where no input is provided
  if (inputData === undefined) {
    throw new Error('No input text provided');
  }
  
  // Convert input to string if necessary
  const inputText = typeof inputData === 'string' 
    ? inputData 
    : JSON.stringify(inputData);
  
  // Get the operation type from node data
  const operation = nodeData.operation || 'uppercase';
  
  // Apply the formatting operation
  const formattedText = formatText(inputText, operation);
  
  // Return the formatted text - BaseExecutor will format this into standardized output
  return {
    formatted_text: formattedText,
    // Include metadata about the operation
    meta: {
      operation: operation,
      inputLength: inputText.length,
      outputLength: formattedText.length
    }
  };
}

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<TextFormatterData>('text_formatter', processNode);