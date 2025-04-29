/**
 * Processing Node Template Definition
 * 
 * This template provides a foundation for creating nodes that process data
 * in various ways, from simple transformations to complex computations.
 * 
 * How to use this template:
 * 1. Copy this folder to your desired location
 * 2. Rename the node type and customize settings
 * 3. Implement the specific processing logic in executor.ts
 * 4. Update the UI component as needed
 */

import { NodeDefinition } from '@/nodes/types';
import { z } from 'zod';

const definition: NodeDefinition = {
  // CUSTOMIZE THIS: Change the type to a unique identifier for your node
  type: 'my_processing_node',
  
  // CUSTOMIZE THIS: Update name and description
  name: 'Data Processor',
  description: 'Transforms data using customizable processing logic',
  
  // CUSTOMIZE THIS: Set the appropriate category
  category: 'processing',
  
  // CUSTOMIZE THIS: Set the version
  version: '1.0.0',
  
  // Define inputs and outputs
  inputs: {
    // CUSTOMIZE THIS: Define the inputs your node requires
    data: {
      type: 'any',
      description: 'Input data to process'
    },
    // Add more inputs as needed
    options: {
      type: 'object',
      description: 'Processing options (optional)',
      optional: true
    }
  },
  
  outputs: {
    // CUSTOMIZE THIS: Define the outputs your node produces
    result: {
      type: 'any',
      description: 'Processed output data'
    },
    // Add error output for robust error handling
    error: {
      type: 'object',
      description: 'Error information if processing fails'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    // CUSTOMIZE THIS: Add settings specific to your processing node
    {
      key: 'processingMode',
      type: 'select',
      label: 'Processing Mode',
      description: 'Select how the data should be processed',
      options: [
        { value: 'transform', label: 'Transform' },
        { value: 'filter', label: 'Filter' },
        { value: 'aggregate', label: 'Aggregate' },
        { value: 'validate', label: 'Validate' },
        { value: 'custom', label: 'Custom' }
      ],
      default: 'transform'
    },
    {
      key: 'processingLogic',
      type: 'textarea',
      label: 'Processing Logic',
      description: 'JavaScript code that defines the processing logic (uses the process function)',
      placeholder: 'function process(data, options) {\n  // Your processing logic here\n  return data;\n}'
    },
    {
      key: 'enableValidation',
      type: 'select',
      label: 'Enable Validation',
      description: 'Validate input and output data',
      options: [
        { value: 'true', label: 'Yes - Validate Data' },
        { value: 'false', label: 'No - Skip Validation' }
      ],
      default: 'false'
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Maximum execution time in milliseconds',
      min: 100,
      max: 30000,
      default: 5000
    },
    {
      key: 'errorHandling',
      type: 'select',
      label: 'Error Handling',
      description: 'How to handle errors during processing',
      options: [
        { value: 'throw', label: 'Throw Error (stop workflow)' },
        { value: 'continue', label: 'Continue with Error Output' },
        { value: 'fallback', label: 'Use Fallback Value' }
      ],
      default: 'throw'
    },
    {
      key: 'fallbackValue',
      type: 'text',
      label: 'Fallback Value (JSON)',
      description: 'JSON value to use if processing fails and error handling is set to "fallback"',
      placeholder: '{}',
      conditions: [
        {
          field: 'errorHandling',
          value: 'fallback'
        }
      ]
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    processingMode: z.enum(['transform', 'filter', 'aggregate', 'validate', 'custom'])
      .default('transform'),
    processingLogic: z.string()
      .default('function process(data, options) {\n  // Your processing logic here\n  return data;\n}'),
    enableValidation: z.union([z.boolean(), z.enum(['true', 'false'])])
      .transform(val => typeof val === 'string' ? val === 'true' : val)
      .default(false),
    timeout: z.number().min(100).max(30000).default(5000),
    errorHandling: z.enum(['throw', 'continue', 'fallback']).default('throw'),
    fallbackValue: z.string().default('{}').optional()
  }),
  
  // Default data
  defaultData: {
    label: 'Data Processor',
    description: 'Transforms data using customizable processing logic',
    processingMode: 'transform',
    processingLogic: 'function process(data, options) {\n  // Your processing logic here\n  return data;\n}',
    enableValidation: false,
    timeout: 5000,
    errorHandling: 'throw'
  },
  
  // CUSTOMIZE THIS: Set the icon for your node
  icon: 'process'
};

// Additional metadata for UI/rendering
export const nodeMetadata = {
  tags: ['data', 'processing', 'transform', 'filter', 'custom'],
  color: '#3B82F6', // Blue color
  templateLibrary: {
    // CUSTOMIZE THIS: Add template examples for different processing modes
    transform: `function process(data, options = {}) {
  // Transform each property in the input data
  const result = {};
  
  if (typeof data === 'object' && data !== null) {
    // Process object properties
    Object.entries(data).forEach(([key, value]) => {
      // Example transformation: convert strings to uppercase
      if (typeof value === 'string') {
        result[key] = value.toUpperCase();
      } 
      // Example transformation: double numbers
      else if (typeof value === 'number') {
        result[key] = value * 2;
      }
      // Pass through other types unchanged
      else {
        result[key] = value;
      }
    });
    
    // Add processing metadata
    result._processed = true;
    result._timestamp = new Date().toISOString();
  } else {
    // For non-object data, return as is
    return data;
  }
  
  return result;
}`,
    filter: `function process(data, options = {}) {
  // Filter an array of items based on criteria
  if (!Array.isArray(data)) {
    throw new Error('Input data must be an array for filter mode');
  }
  
  // Get filter criteria from options or use defaults
  const criteria = options.criteria || {};
  
  // Filter the array based on the criteria
  return data.filter(item => {
    // Check each criterion against the item
    for (const [key, value] of Object.entries(criteria)) {
      if (item[key] !== value) {
        return false;
      }
    }
    return true;
  });
}`,
    aggregate: `function process(data, options = {}) {
  // Aggregate values from an array of objects
  if (!Array.isArray(data)) {
    throw new Error('Input data must be an array for aggregate mode');
  }
  
  // Get aggregation field from options or use default
  const field = options.field || 'value';
  const method = options.method || 'sum';
  
  let result;
  
  switch (method) {
    case 'sum':
      result = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
      break;
    case 'avg':
      result = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / (data.length || 1);
      break;
    case 'min':
      result = Math.min(...data.map(item => Number(item[field]) || 0));
      break;
    case 'max':
      result = Math.max(...data.map(item => Number(item[field]) || 0));
      break;
    case 'count':
      result = data.length;
      break;
    default:
      result = data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
  }
  
  return {
    result,
    method,
    field,
    count: data.length
  };
}`,
    validate: `function process(data, options = {}) {
  // Validate input data against a schema
  const schema = options.schema || {
    required: ['id', 'name'],
    types: {
      id: 'string',
      name: 'string',
      age: 'number'
    }
  };
  
  const results = {
    valid: true,
    errors: [],
    data
  };
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (data[field] === undefined || data[field] === null) {
        results.valid = false;
        results.errors.push(\`Missing required field: \${field}\`);
      }
    }
  }
  
  // Check field types
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (data[field] !== undefined && typeof data[field] !== expectedType) {
        results.valid = false;
        results.errors.push(\`Invalid type for \${field}: expected \${expectedType}, got \${typeof data[field]}\`);
      }
    }
  }
  
  return results;
}`,
    custom: `function process(data, options = {}) {
  // Custom processing example: data enrichment
  
  // Create a copy of the input to avoid modifying the original
  const processed = typeof data === 'object' ? { ...data } : data;
  
  // Add processing metadata
  const metadata = {
    processed: true,
    timestamp: new Date().toISOString(),
    processorId: 'custom-processor'
  };
  
  // Combine data with metadata
  return {
    data: processed,
    metadata,
    options
  };
}`
  }
};

export default definition;