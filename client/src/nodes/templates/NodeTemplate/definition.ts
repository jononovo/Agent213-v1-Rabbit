/**
 * Node Template - Definition
 * 
 * This is a template for creating new node definitions.
 * Copy this file to create a new node and modify it to fit your needs.
 */

import { NodeDefinition } from '../../core/types/nodeDefinitions';

const definition: NodeDefinition = {
  type: 'NodeTemplate',
  name: 'Node Template',
  description: 'A template for creating new nodes',
  category: 'Templates',
  version: '1.0.0',
  
  // Define the inputs for this node
  inputs: {
    // Every input port needs a type and description
    input1: {
      type: 'string',
      description: 'First input port',
    },
    input2: {
      type: 'number',
      description: 'Second input port',
      optional: true, // This input is optional
    },
  },
  
  // Define the outputs for this node
  outputs: {
    // Every output port needs a type and description
    output1: {
      type: 'string',
      description: 'First output port',
    },
    output2: {
      type: 'object',
      description: 'Second output port',
    },
  },
  
  // Default data/parameters for this node
  defaultData: {
    parameter1: 'default value',
    parameter2: 42,
    parameter3: true,
  },
  
  // Icon representation (using Lucide icon names)
  icon: 'box',
};

export default definition;