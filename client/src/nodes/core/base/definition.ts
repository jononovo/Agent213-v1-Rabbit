/**
 * Base Node Definition
 * 
 * This file defines the base node type, with its inputs, outputs,
 * and basic functionality. It serves as the foundation for all other 
 * node types in the system.
 */

import { NodeSchema } from '../types';

/**
 * Base node interface definition
 */
export const baseNodeDefinition: NodeSchema = {
  inputs: {
    input: {
      type: 'any',
      description: 'General input data'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'General output data'
    }
  }
};

/**
 * Base node metadata
 */
export const baseNodeInfo = {
  type: 'base',
  name: 'Base Node',
  description: 'The foundation node that can be extended for any purpose.',
  category: 'general',
  icon: 'box',
  defaultData: {
    label: 'Node',
    description: 'Generic node',
    settings: {}
  }
};