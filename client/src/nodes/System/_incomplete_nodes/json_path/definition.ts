/**
 * JSONPath Node Definition
 * 
 * This file defines the metadata and schema for the JSONPath node.
 */

import { NodeDefinition } from '../types';

// Define node definition
const definition: NodeDefinition = {
  type: 'json_path',
  name: 'JSONPath',
  description: 'Extract data from JSON objects using path expressions',
  category: 'data',
  version: '1.0.0',
  icon: 'braces',
  
  inputs: {
    data: {
      type: 'object',
      description: 'JSON data to extract from'
    }
  },
  
  outputs: {
    value: {
      type: 'any',
      description: 'The extracted value'
    },
    error: {
      type: 'string',
      description: 'Error message if the extraction fails'
    }
  },
  
  configOptions: [
    {
      key: 'path',
      type: 'string',
      description: 'JSONPath expression to extract data (e.g., $.user.name)',
      default: '$.data'
    }
  ],
  
  defaultData: {
    path: '$.data'
  }
};

// Additional metadata for UI/rendering (optional)
export const nodeMetadata = {
  tags: ['data', 'json', 'extract', 'query', 'path'],
  color: '#F59E0B' // Amber color
};

export default definition;