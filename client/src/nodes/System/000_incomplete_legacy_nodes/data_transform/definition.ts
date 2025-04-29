/**
 * Data Transform Node Definition
 * 
 * This file defines the metadata and schema for the Data Transform node.
 */

import { NodeDefinition } from '../types';

// Define node definition
const definition: NodeDefinition = {
  type: 'data_transform',
  name: 'Data Transform',
  description: 'Transform data with JavaScript expressions and operations',
  category: 'data',
  version: '1.0.0',
  icon: 'function-square',
  
  inputs: {
    data: {
      type: 'any',
      description: 'Input data to be transformed'
    }
  },
  
  outputs: {
    result: {
      type: 'any',
      description: 'The transformed data'
    },
    error: {
      type: 'string',
      description: 'Error message if the transformation fails'
    }
  },
  
  configOptions: [
    {
      key: 'transformations',
      type: 'json',
      description: 'List of transformation operations to apply',
      default: [
        {
          name: 'Default Transform',
          expression: 'data => data',
          enabled: true
        }
      ]
    }
  ],
  
  defaultData: {
    transformations: [
      {
        name: 'Default Transform',
        expression: 'data => data',
        enabled: true
      }
    ]
  }
};

// Additional metadata for UI/rendering (optional)
export const nodeMetadata = {
  tags: ['data', 'transform', 'map', 'filter', 'javascript'],
  color: '#FF5722' // Deep Orange color
};

export default definition;