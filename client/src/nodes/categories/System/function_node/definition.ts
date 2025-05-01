/**
 * Function Node Definition
 * 
 * Enhanced definition file with advanced configuration options and template support.
 */

import { NodeDefinition } from '../../../core/types/nodeDefinitions';
import { z } from 'zod';

const definition: NodeDefinition = {
  type: 'function_node',
  name: 'Function',
  description: 'Custom JavaScript function that transforms data',
  category: 'code',
  version: '1.1.0',
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
      description: 'Error message if function execution failed'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'code',
      type: 'textarea',
      label: 'Function Code',
      description: 'JavaScript function code that processes input data.',
      placeholder: 'function process(input) {\n  // Your code here\n  return input;\n}'
    },
    {
      key: 'selectedTemplate',
      type: 'select',
      label: 'Function Template',
      description: 'Pre-defined template to use for this function.',
      options: [
        { value: 'basic', label: 'Basic (return input)' },
        { value: 'transform', label: 'Data Transform' },
        { value: 'api', label: 'API Request' },
        { value: 'json', label: 'JSON Processing' },
        { value: 'conditional', label: 'Conditional Logic' }
      ],
      default: 'basic'
    },
    {
      key: 'useAsyncFunction',
      type: 'select',
      label: 'Async Function',
      description: 'Use async/await in your function for API calls or other asynchronous operations.',
      options: [
        { value: 'true', label: 'Yes - Use Async Function' },
        { value: 'false', label: 'No - Use Synchronous Function' }
      ],
      default: 'true'
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Maximum execution time in milliseconds.',
      min: 100,
      max: 30000,
      default: 5000
    },
    {
      key: 'errorHandling',
      type: 'select',
      label: 'Error Handling',
      description: 'How to handle errors during function execution.',
      options: [
        { value: 'throw', label: 'Throw Error (stop workflow)' },
        { value: 'return', label: 'Return Error Object (continue workflow)' },
        { value: 'null', label: 'Return Null on Error' }
      ],
      default: 'throw'
    },
    {
      key: 'cacheResults',
      type: 'select',
      label: 'Cache Results',
      description: 'Cache results for identical inputs to improve performance.',
      options: [
        { value: 'true', label: 'Yes - Enable Caching' },
        { value: 'false', label: 'No - Always Execute' }
      ],
      default: 'false'
    },
    {
      key: 'executionEnvironment',
      type: 'select',
      label: 'Execution Environment',
      description: 'Where to execute the function code.',
      options: [
        { value: 'client', label: 'Client-side (browser)' },
        { value: 'server', label: 'Server-side (Node.js)' }
      ],
      default: 'client'
    }
  ],
  
  // Keep configOptions for backward compatibility
  configOptions: [
    {
      key: 'code',
      type: 'string',
      description: 'JavaScript function code',
      default: 'function process(input) {\n  // Your code here\n  return input;\n}'
    },
    {
      key: 'timeout',
      type: 'number',
      description: 'Maximum execution time in milliseconds',
      default: 5000
    },
    {
      key: 'useAsyncFunction',
      type: 'boolean',
      description: 'Whether to execute the function asynchronously',
      default: true
    },
    {
      key: 'errorHandling',
      type: 'select',
      description: 'How to handle errors in the function',
      options: [
        { label: 'Throw error', value: 'throw' },
        { label: 'Return error object', value: 'return' },
        { label: 'Return null on error', value: 'null' }
      ],
      default: 'throw'
    },
    {
      key: 'selectedTemplate',
      type: 'select',
      description: 'Function template to use (will replace current code)',
      options: [
        { label: 'Basic (return input)', value: 'basic' },
        { label: 'Data Transform', value: 'transform' },
        { label: 'API Request', value: 'api' },
        { label: 'JSON Processing', value: 'json' },
        { label: 'Conditional Logic', value: 'conditional' }
      ],
      default: 'basic'
    },
    {
      key: 'cacheResults',
      type: 'boolean',
      description: 'Cache results for identical inputs',
      default: false
    },
    {
      key: 'executionEnvironment',
      type: 'select',
      description: 'Where to execute the function (client vs server)',
      options: [
        { label: 'Client-side', value: 'client' },
        { label: 'Server-side', value: 'server' }
      ],
      default: 'client'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    code: z.string().default('function process(input) {\n  // Your code here\n  return input;\n}'),
    timeout: z.number().min(100).max(30000).default(5000),
    useAsyncFunction: z.union([z.boolean(), z.enum(['true', 'false'])]).transform(val => 
      typeof val === 'string' ? val === 'true' : val
    ).default(true),
    errorHandling: z.enum(['throw', 'return', 'null']).default('throw'),
    selectedTemplate: z.enum(['basic', 'transform', 'api', 'json', 'conditional']).default('basic'),
    cacheResults: z.union([z.boolean(), z.enum(['true', 'false'])]).transform(val => 
      typeof val === 'string' ? val === 'true' : val
    ).default(false),
    executionEnvironment: z.enum(['client', 'server']).default('client')
  }),
  
  defaultData: {
    label: 'Function',
    description: 'Custom JavaScript function',
    code: 'function process(input) {\n  // Your code here\n  return input;\n}',
    timeout: 5000,
    useAsyncFunction: true,
    errorHandling: 'throw',
    selectedTemplate: 'basic',
    executionEnvironment: 'client',
    cacheResults: false
  },
  icon: 'code'
};

// Additional metadata for UI/rendering
export const nodeMetadata = {
  tags: ['code', 'function', 'javascript', 'custom', 'scripting'],
  color: '#2196F3',
  templateLibrary: {
    basic: `function process(input) {
  // Basic function that returns input data
  return input;
}`,
    transform: `function process(input) {
  // Transform data from one format to another
  const transformed = {
    id: input.id || Math.random().toString(36).substring(2, 9),
    title: input.name || input.title,
    description: input.summary || input.description || '',
    timestamp: new Date().toISOString(),
    processed: true
  };
  
  return transformed;
}`,
    api: `async function process(input) {
  // Make API requests (browser-only, use server-side for private keys)
  const response = await fetch('https://api.example.com/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  if (!response.ok) {
    throw new Error(\`API request failed: \${response.status}\`);
  }
  
  return await response.json();
}`,
    json: `function process(input) {
  // Process and validate JSON data
  try {
    // Parse if string is provided
    const jsonData = typeof input === 'string' ? JSON.parse(input) : input;
    
    // Extract specific fields
    const { id, items = [], metadata = {} } = jsonData;
    
    // Process each item
    const processedItems = items.map(item => ({
      ...item,
      processed: true
    }));
    
    return {
      id,
      items: processedItems,
      metadata,
      itemCount: processedItems.length
    };
  } catch (error) {
    throw new Error(\`JSON processing error: \${error.message}\`);
  }
}`,
    conditional: `function process(input) {
  // Implement conditional logic to route data
  if (!input) {
    return { status: 'error', message: 'No data provided' };
  }
  
  // Route based on data type
  if (Array.isArray(input)) {
    return { 
      type: 'array',
      count: input.length,
      items: input
    };
  } else if (typeof input === 'object') {
    return { 
      type: 'object',
      keys: Object.keys(input),
      values: Object.values(input),
      data: input
    };
  } else {
    return { 
      type: typeof input,
      value: input
    };
  }
}`
  },
  
  // Add handlers for settings initialization and saving
  handlers: {
    // Initialize settings from node data
    initializeSettings: (nodeData: Record<string, any>) => {
      // Start with existing settings or empty object
      const settings = { ...(nodeData.settings || {}) };
      
      // Copy standard function node fields from node data to settings
      ['code', 'selectedTemplate', 'useAsyncFunction', 'timeout', 
       'errorHandling', 'cacheResults', 'executionEnvironment'].forEach(key => {
        if (nodeData[key] !== undefined) {
          settings[key] = nodeData[key];
        }
      });
      
      return settings;
    },
    
    // Handle template selection and prepare save data
    prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
      const saveData = { ...settings };
      
      // Add nodeProperties (like label and description)
      if (nodeProperties) {
        saveData.nodeProperties = nodeProperties;
      }
      
      return saveData;
    }
  }
};

export default definition;