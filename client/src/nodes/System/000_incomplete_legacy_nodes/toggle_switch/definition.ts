/**
 * Toggle Switch Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../types';

export const definition: NodeDefinition = {
  type: 'toggle_switch',
  name: 'Toggle Switch',
  description: 'A simple boolean toggle switch',
  icon: 'toggle-left',
  category: 'input',
  version: '1.0.0',
  inputs: {},
  outputs: {
    boolean: {
      type: 'boolean',
      description: 'The boolean state of the toggle'
    },
    condition: {
      type: 'string',
      description: 'The condition as text (true/false)'
    }
  },
  configOptions: [
    {
      key: 'defaultState',
      type: 'boolean',
      default: false,
      description: 'Default state of the toggle'
    },
    {
      key: 'trueLabel',
      type: 'string',
      default: 'On',
      description: 'Label to display when toggle is true'
    },
    {
      key: 'falseLabel',
      type: 'string',
      default: 'Off',
      description: 'Label to display when toggle is false'
    },
    {
      key: 'iconColor',
      type: 'string',
      default: 'blue',
      description: 'Color of toggle icon when active'
    }
  ],
  defaultData: {
    defaultState: false,
    toggleState: false,
    trueLabel: 'On',
    falseLabel: 'Off',
    iconColor: 'blue',
    label: 'Toggle Switch'
  }
};

export default definition;