/**
 * Base Node Template Definition
 * 
 * This is a minimal template for creating new nodes.
 * Replace this comment with a description of your node's purpose.
 */

import { NodeDefinition } from '@/types';

// Define the structure of node data
export interface BaseNodeTemplateData {
  // Add your custom properties here
  label: string;
  description: string;
  // Add any other properties your node needs
}

// Default data for this node type
export const defaultData: BaseNodeTemplateData = {
  label: 'Base Node Template',
  description: 'A minimal template for creating custom nodes',
  // Initialize other properties with default values
};

// Node definition for registration in the node registry
export const definition: NodeDefinition = {
  type: 'base_node_template', // Unique identifier for this node type
  name: 'Base Node Template',  // Human-readable name
  description: 'A minimal template for creating custom nodes',
  category: 'custom', // Default category (update as needed)
  defaultData,
  inputs: {
    // Define your input ports here
    input: {
      type: 'any',
      description: 'Primary input port'
    }
  },
  outputs: {
    // Define your output ports here
    output: {
      type: 'any',
      description: 'Primary output port'
    }
  }
};