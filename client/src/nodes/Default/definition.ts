/**
 * Default Node Definition - DEPRECATED
 * 
 * ⚠️ DEPRECATED: This node has been renamed to "BaseNode" and moved to the "Base" folder.
 * Please use BaseNode instead as this Default implementation will be removed in the future.
 * 
 * This file defines the default node type, with its inputs, outputs,
 * and basic functionality.
 */

// Log deprecation warning
console.warn("The Default node definition is deprecated. Please use BaseNode from the Base folder instead.");

import { NodeInterfaceDefinition } from '../types';

/**
 * Default node interface definition
 */
export const defaultNodeDefinition: NodeInterfaceDefinition = {
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
 * Default node metadata
 */
export const defaultNodeInfo = {
  type: 'default',
  name: 'Default Node',
  description: 'A generic node that can be used for any purpose.',
  category: 'general',
  icon: 'box',
  defaultData: {
    label: 'Node',
    description: 'Generic node',
    settings: {}
  }
};