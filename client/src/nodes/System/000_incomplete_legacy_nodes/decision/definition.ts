/**
 * Decision Node Definition
 * 
 * This file defines the metadata and schema for the Decision node.
 */

import { NodeDefinition } from '../types';

// Define node definition
const definition: NodeDefinition = {
  type: 'decision',
  name: 'Decision',
  description: 'Create conditional branches in workflows based on rules',
  category: 'logic',
  version: '1.0.0',
  icon: 'git-branch',
  
  inputs: {
    value: {
      type: 'any',
      description: 'Value to evaluate against conditions'
    }
  },
  
  outputs: {
    true: {
      type: 'any',
      description: 'Output if condition is true'
    },
    false: {
      type: 'any',
      description: 'Output if condition is false'
    },
    error: {
      type: 'string',
      description: 'Error message if the condition evaluation fails'
    }
  },
  
  configOptions: [
    {
      key: 'condition',
      type: 'string',
      description: 'JavaScript expression for the condition (e.g., value > 10)',
      default: 'value === true'
    }
  ],
  
  defaultData: {
    condition: 'value === true'
  }
};

// Additional metadata for UI/rendering (optional)
export const nodeMetadata = {
  tags: ['logic', 'decision', 'branch', 'condition', 'if', 'else'],
  color: '#10B981' // Emerald color
};

export default definition;