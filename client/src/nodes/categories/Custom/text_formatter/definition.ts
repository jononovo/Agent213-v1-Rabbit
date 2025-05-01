/**
 * Text Formatter Node Definition
 * 
 * This node performs various text formatting operations like
 * uppercase, lowercase, title case, etc.
 */

import { NodeDefinition } from '../../../core/types/nodeDefinitions';
import { z } from 'zod';

// Define the structure of node data
export interface TextFormatterData {
  label: string;
  description: string;
  operation: 'uppercase' | 'lowercase' | 'titlecase' | 'trim' | 'reverse';
}

// Default data for this node type
export const defaultData: TextFormatterData = {
  label: 'Text Formatter',
  description: 'Applies formatting operations to text input',
  operation: 'uppercase'
};

// Node definition for registration in the node registry
export const definition: NodeDefinition = {
  type: 'text_formatter',
  name: 'Text Formatter',
  description: 'Applies formatting operations to text input',
  category: 'processing',
  icon: 'type',
  version: '1.0.0',
  defaultData,
  inputs: {
    text: {
      type: 'string',
      description: 'Text to format'
    }
  },
  outputs: {
    formatted_text: {
      type: 'string',
      description: 'Formatted text output'
    }
  },
  settings: [
    {
      key: 'operation',
      type: 'select',
      label: 'Operation',
      description: 'Text formatting operation to apply',
      options: [
        { label: 'Uppercase', value: 'uppercase' },
        { label: 'Lowercase', value: 'lowercase' },
        { label: 'Title Case', value: 'titlecase' },
        { label: 'Trim Whitespace', value: 'trim' },
        { label: 'Reverse Text', value: 'reverse' }
      ],
      default: 'uppercase'
    }
  ],
  validation: z.object({
    operation: z.enum(['uppercase', 'lowercase', 'titlecase', 'trim', 'reverse']).default('uppercase')
  })
};

export default definition;