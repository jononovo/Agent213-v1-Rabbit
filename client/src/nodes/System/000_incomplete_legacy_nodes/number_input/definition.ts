/**
 * Number Input Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../types';

export const definition: NodeDefinition = {
  type: 'number_input',
  name: 'Number Input',
  description: 'Provides numeric input with slider visualization',
  icon: 'hash',
  category: 'input',
  version: '1.0.0',
  inputs: {},
  outputs: {
    number: {
      type: 'number',
      description: 'The numeric value'
    },
    numberAsString: {
      type: 'string',
      description: 'The numeric value as a string'
    }
  },
  configOptions: [
    {
      key: 'min',
      type: 'number',
      default: 0,
      description: 'Minimum value'
    },
    {
      key: 'max',
      type: 'number',
      default: 100,
      description: 'Maximum value'
    },
    {
      key: 'step',
      type: 'number',
      default: 1,
      description: 'Step size'
    },
    {
      key: 'defaultValue',
      type: 'number',
      default: 50,
      description: 'Default value'
    },
    {
      key: 'showSlider',
      type: 'boolean',
      default: true,
      description: 'Show visual slider'
    }
  ],
  defaultData: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 50,
    inputValue: 50,
    showSlider: true,
    label: 'Number Input'
  }
};

export default definition;