/**
 * Text Formatter Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../types';

export const definition: NodeDefinition = {
  type: 'text_formatter',
  name: 'Text Formatter',
  description: 'Formats text with various transformations',
  icon: 'text',
  category: 'text',
  version: '1.0.0',
  inputs: {
    text: {
      type: 'string',
      description: 'The text to format'
    }
  },
  outputs: {
    formattedText: {
      type: 'string',
      description: 'The formatted text'
    }
  },
  configOptions: [
    {
      key: 'formatType',
      type: 'select',
      options: [
        { label: 'Uppercase', value: 'uppercase' },
        { label: 'Lowercase', value: 'lowercase' },
        { label: 'Title Case', value: 'titlecase' },
        { label: 'Trim Whitespace', value: 'trim' }
      ],
      default: 'uppercase',
      description: 'Type of formatting to apply'
    },
    {
      key: 'addPrefix',
      type: 'string',
      default: '',
      description: 'Optional prefix to add to the text'
    },
    {
      key: 'addSuffix',
      type: 'string',
      default: '',
      description: 'Optional suffix to add to the text'
    }
  ],
  defaultData: {
    formatType: 'uppercase',
    addPrefix: '',
    addSuffix: ''
  }
};

export default definition;