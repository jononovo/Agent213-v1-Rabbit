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

import { NodeDefinition } from '../../nodes/types';
import { z } from 'zod';

const definition: NodeDefinition = {
  type: 'processing_node',
  name: 'Processing Node',
  description: 'Processes data using JavaScript functions',
  category: 'code',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to process'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Processed output data'
    },
    error: {
      type: 'string',
      description: 'Error message if processing failed'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'code',
      type: 'textarea',
      label: 'Processing Code',
      description: 'JavaScript function code that processes input data.',
      placeholder: 'function process(input) {\n  // Your code here\n  return input;\n}'
    },
    {
      key: 'selectedTemplate',
      type: 'select',
      label: 'Code Template',
      description: 'Pre-defined template to use for this function.',
      options: [
        { value: 'basic', label: 'Basic (return input)' },
        { value: 'transform', label: 'Data Transform' },
        { value: 'filter', label: 'Filter Data' },
        { value: 'enrich', label: 'Enrich Data' }
      ],
      default: 'basic'
    },
    {
      key: 'useAsyncFunction',
      type: 'select',
      label: 'Async Function',
      description: 'Use async/await for asynchronous operations.',
      options: [
        { value: 'true', label: 'Yes - Use Async Function' },
        { value: 'false', label: 'No - Use Synchronous Function' }
      ],
      default: 'false'
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Maximum execution time in milliseconds.',
      min: 100,
      max: 30000,
      default: 5000
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    code: z.string().default('function process(input) {\n  // Your code here\n  return input;\n}'),
    timeout: z.number().min(100).max(30000).default(5000),
    useAsyncFunction: z.union([z.boolean(), z.enum(['true', 'false'])]).transform(val => 
      typeof val === 'string' ? val === 'true' : val
    ).default(false),
    selectedTemplate: z.enum(['basic', 'transform', 'filter', 'enrich']).default('basic')
  }),
  
  defaultData: {
    label: 'Process',
    description: 'Processes data using JavaScript',
    code: 'function process(input) {\n  // Your code here\n  return input;\n}',
    timeout: 5000,
    useAsyncFunction: false,
    selectedTemplate: 'basic'
  },
  icon: 'code'
};

// Additional metadata for UI/rendering
export const nodeMetadata = {
  tags: ['code', 'function', 'javascript', 'processing', 'data'],
  templateLibrary: {
    basic: `function process(input) {
  // Basic function that returns input data
  return input;
}`,
    transform: `function process(input) {
  // Transform data from one format to another
  const transformed = {
    id: input.id || Math.random().toString(36).substring(2, 9),
    content: input.text || input.content || '',
    transformed: true,
    timestamp: new Date().toISOString()
  };
  
  return transformed;
}`,
    filter: `function process(input) {
  // Filter an array of items based on criteria
  if (!Array.isArray(input)) {
    return input; // Not an array, return as is
  }
  
  // Filter items based on custom criteria
  const filtered = input.filter(item => {
    // Replace with your filtering logic
    return item && typeof item === 'object' && !item.excluded;
  });
  
  return {
    original: input.length,
    filtered: filtered.length,
    items: filtered
  };
}`,
    enrich: `function process(input) {
  // Enrich data with additional information
  if (!input) return null;
  
  // Check if input is an array
  if (Array.isArray(input)) {
    return input.map(item => ({
      ...item,
      enriched: true,
      processedAt: new Date().toISOString()
    }));
  }
  
  // Handle single object
  return {
    ...input,
    enriched: true,
    processedAt: new Date().toISOString()
  };
}`
  }
};

export const processingTemplate = `function process(data, options = {}) {
  // This is a template function to be customized for your needs
  try {
    // Your processing logic here
    return data;
  } catch (error) {
    console.error('Processing error:', error);
    throw new Error(\`Processing failed: \${error.message}\`);
  }
}`;

export default definition;