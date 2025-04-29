/**
 * Processing Node Template Definition
 * 
 * This template provides a foundation for creating nodes that process data
 * using JavaScript functions.
 * 
 * How to use this template:
 * 1. Copy this folder to your desired location
 * 2. Rename the node type and customize settings
 * 3. Implement your specific processing logic
 */

import { NodeDefinition } from '@/nodes/types';
import { z } from 'zod';

const definition: NodeDefinition = {
  // CUSTOMIZE THIS: Change the type to a unique identifier for your node
  type: 'my_processing_node',
  
  // CUSTOMIZE THIS: Update name and description
  name: 'Data Processor',
  description: 'Processes data using custom JavaScript',
  
  // CUSTOMIZE THIS: Set the appropriate category
  category: 'processing',
  
  // CUSTOMIZE THIS: Set the version
  version: '1.0.0',
  
  // Define inputs and outputs
  inputs: {
    data: {
      type: 'any',
      description: 'Input data to process'
    },
    options: {
      type: 'object',
      description: 'Processing options (optional)',
      optional: true
    }
  },
  
  outputs: {
    result: {
      type: 'any',
      description: 'Processed output data'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'processingLogic',
      type: 'textarea',
      label: 'Processing Logic',
      description: 'JavaScript code that defines the processing logic',
      placeholder: 'function process(data, options) {\n  // Your processing logic here\n  return data;\n}'
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Maximum execution time in milliseconds',
      min: 100,
      max: 30000,
      default: 5000
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    processingLogic: z.string()
      .default('function process(data, options) {\n  // Your processing logic here\n  return data;\n}'),
    timeout: z.number().min(100).max(30000).default(5000)
  }),
  
  // Default data
  defaultData: {
    label: 'Data Processor',
    description: 'Processes data using custom JavaScript',
    processingLogic: 'function process(data, options) {\n  // Your processing logic here\n  return data;\n}',
    timeout: 5000
  },
  
  // CUSTOMIZE THIS: Set the icon for your node
  icon: 'code'
};

// Simple example template for reference
export const processingTemplate = `function process(data, options = {}) {
  // Example: Transform object properties
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const result = {};
    
    // Process each property
    for (const [key, value] of Object.entries(data)) {
      // Example transformation: convert strings to uppercase
      if (typeof value === 'string') {
        result[key] = value.toUpperCase();
      } else {
        result[key] = value;
      }
    }
    
    return {
      ...result,
      processed: true,
      timestamp: new Date().toISOString()
    };
  }
  
  // Example: Process array data
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return { ...item, processed: true };
      }
      return item;
    });
  }
  
  // For simple values, just return as is
  return data;
}`;

export default definition;