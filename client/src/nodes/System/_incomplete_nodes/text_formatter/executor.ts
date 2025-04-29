/**
 * Text Formatter Node Executor
 * 
 * This file contains the logic for executing the text formatter node.
 * It applies various text transformations based on node configuration.
 */

import { createNodeOutput, createErrorOutput } from '../../nodeOutputUtils';
import { NodeExecutionData } from '@shared/nodeTypes';

export interface TextFormatterNodeData {
  formatType: 'uppercase' | 'lowercase' | 'titlecase' | 'trim';
  addPrefix: string;
  addSuffix: string;
}

/**
 * Converts a string to title case (capitalize first letter of each word)
 */
function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export const execute = async (
  nodeData: TextFormatterNodeData,
  inputs: Record<string, any>
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // Check if we have text input
    if (!inputs || !inputs.text) {
      return createErrorOutput('No text input provided', 'text_formatter');
    }
    
    // Get the input text
    const inputText = typeof inputs.text === 'string' 
      ? inputs.text 
      : JSON.stringify(inputs.text);
    
    // Apply the selected formatting
    let formattedText = inputText;
    
    switch (nodeData.formatType) {
      case 'uppercase':
        formattedText = inputText.toUpperCase();
        break;
      case 'lowercase':
        formattedText = inputText.toLowerCase();
        break;
      case 'titlecase':
        formattedText = toTitleCase(inputText);
        break;
      case 'trim':
        formattedText = inputText.trim();
        break;
      default:
        // If no format type is specified, keep the original text
        break;
    }
    
    // Add prefix and suffix if provided
    if (nodeData.addPrefix) {
      formattedText = nodeData.addPrefix + formattedText;
    }
    
    if (nodeData.addSuffix) {
      formattedText += nodeData.addSuffix;
    }
    
    // Return the result in our standardized format
    return createNodeOutput({
      text: formattedText
    }, {
      startTime,
      additionalMeta: {
        formatType: nodeData.formatType,
        originalLength: inputText.length,
        formattedLength: formattedText.length
      }
    });
  } catch (error: any) {
    console.error('Error in text_formatter executor:', error);
    return createErrorOutput(
      error.message || 'Error formatting text',
      'text_formatter'
    );
  }
};