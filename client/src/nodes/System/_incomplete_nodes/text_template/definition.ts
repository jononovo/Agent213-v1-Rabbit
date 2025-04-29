/**
 * Text Template Node Definition
 * 
 * This file defines the metadata and schema for the Text Template node.
 */

import { NodeDefinition } from '../types';

// Define node definition
const definition: NodeDefinition = {
  type: 'text_template',
  name: 'Text Template',
  description: 'Generate text using a template with variable placeholders',
  category: 'text',
  version: '1.0.0',
  icon: 'file-text',
  
  inputs: {
    variables: {
      type: 'object',
      description: 'Variables to use in the template'
    }
  },
  
  outputs: {
    text: {
      type: 'string',
      description: 'Generated text from the template'
    },
    error: {
      type: 'string',
      description: 'Error message if template processing fails'
    }
  },
  
  configOptions: [
    {
      key: 'template',
      type: 'string',
      description: 'Template string with variable placeholders (e.g., {{variableName}})',
      default: 'Hello, {{name}}!'
    }
  ],
  
  defaultData: {
    template: 'Hello, {{name}}!'
  }
};

// Additional metadata for UI/rendering (optional)
export const nodeMetadata = {
  tags: ['text', 'template', 'formatting', 'variables'],
  color: '#8B5CF6' // Purple color
};

export default definition;