/**
 * Base Standard Node Definition
 * 
 * This is a template for creating standard nodes.
 * Modify this file to match your node's specific requirements.
 */

import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  // REQUIRED: Unique identifier for the node (change this to your node type)
  type: 'base_node_standard',
  
  // REQUIRED: Display name shown in the node palette
  name: 'Base Standard Node',
  
  // REQUIRED: Description of what the node does
  description: 'Template for creating standard nodes',
  
  // OPTIONAL: Icon name from Lucide icons
  icon: 'box',
  
  // REQUIRED: Category for grouping in the node palette
  category: 'general',
  
  // REQUIRED: Version of the node
  version: '1.0.0',
  
  // REQUIRED: Input ports definition (can be empty object if no inputs)
  inputs: {
    // Example input port - modify or add more as needed
    input: {
      type: 'string',  // Type: string, number, boolean, object, array
      description: 'Input data',
    }
  },
  
  // REQUIRED: Output ports definition
  outputs: {
    // Example output port - modify or add more as needed
    output: {
      type: 'string',
      description: 'Processed output',
    }
  },
  
  // OPTIONAL: Default configuration values for your node
  defaultData: {
    // Add your default configuration values here
    setting1: 'default value',
    setting2: 123,
    setting3: true
  }
};

export default definition;