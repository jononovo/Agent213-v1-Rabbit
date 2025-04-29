/**
 * JSON Parser Node Definition
 * Defines the node's properties, appearance, and behavior
 */

import { NodeDefinition } from '../../types';

export const definition: NodeDefinition = {
  type: 'json_parser',
  name: 'JSON Parser',
  description: 'Parses JSON strings into structured data objects',
  icon: 'braces',
  category: 'data',
  version: '1.0.0',
  inputs: {
    json_string: {
      type: 'string',
      description: 'The JSON string to parse'
    }
  },
  outputs: {
    parsed_data: {
      type: 'object',
      description: 'The parsed JSON object'
    },
    error: {
      type: 'string',
      description: 'Error message if parsing fails',
      optional: true
    }
  },
  configOptions: [
    {
      key: 'returnErrorObject',
      type: 'boolean',
      default: false,
      description: 'Return error as an object with error property instead of failing'
    }
  ],
  defaultData: {
    returnErrorObject: false
  }
};

export default definition;