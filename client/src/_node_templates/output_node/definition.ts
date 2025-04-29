/**
 * Output Node Template Definition
 * 
 * This template provides a foundation for creating nodes that output data 
 * to external systems or serve as workflow endpoints.
 * 
 * How to use this template:
 * 1. Copy this folder to your desired location
 * 2. Rename the node type and customize settings
 * 3. Implement the specific output logic in executor.ts
 * 4. Update the UI component as needed
 */

import { z } from 'zod';
import { ArrowUpToLine } from 'lucide-react'; // Or choose a more appropriate icon

// Default configuration for the node
// CUSTOMIZE THIS: Update with appropriate defaults for your output node
const defaultData = {
  // Output destination configuration
  destinationUrl: '',
  method: 'POST',
  headers: '',
  
  // Output behavior settings
  retryCount: 3,
  retryDelay: 1000,
  timeout: 5000,
  
  // Additional settings as needed
  formatOutput: true,
  responseMode: 'data'
};

// Main node definition
// CUSTOMIZE THIS: Update properties to match your node's purpose
const definition = {
  type: 'my_output_node',          // CHANGE THIS: Set a unique node type identifier
  name: 'My Output Node',          // CHANGE THIS: Set a human-readable name
  description: 'Sends workflow data to an external system or destination',
  category: 'output',              // Recommended for output nodes
  icon: ArrowUpToLine,             // You can change to a different icon from lucide-react
  version: '1.0.0',
  defaultData: defaultData,
  
  // Define inputs for this node
  // This is what the node will receive from upstream nodes
  inputs: {
    data: {
      type: 'any',
      description: 'Data to be output to the destination',
      required: true
    },
    metadata: {
      type: 'object',
      description: 'Optional metadata to include with the output',
      required: false
    }
  },
  
  // Define outputs for this node (if it produces any)
  // Many output nodes don't have outputs as they're endpoints
  outputs: {
    response: {
      type: 'object',
      description: 'Response received from the destination (if applicable)'
    },
    status: {
      type: 'number',
      description: 'Status code or result indicator'
    }
  },
  
  // Define fields for the node's settings drawer
  // CUSTOMIZE THIS: Update with settings specific to your output node
  settings: [
    {
      key: 'destinationUrl',
      type: 'string',
      label: 'Destination URL',
      description: 'URL where the data will be sent',
      placeholder: 'https://example.com/api/endpoint',
      required: false
    },
    {
      key: 'method',
      type: 'select',
      label: 'HTTP Method',
      description: 'HTTP method to use for the request',
      options: [
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' }
      ],
      default: 'POST'
    },
    {
      key: 'headers',
      type: 'textarea',
      label: 'Custom Headers',
      description: 'Custom HTTP headers to include in the request (JSON format)',
      placeholder: '{"Content-Type": "application/json", "Authorization": "Bearer your-token"}',
      required: false
    },
    {
      key: 'formatOutput',
      type: 'select',
      label: 'Format Output',
      description: 'Whether to format the output data before sending',
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' }
      ],
      default: 'true'
    },
    {
      key: 'responseMode',
      type: 'select',
      label: 'Response Mode',
      description: 'What part of the response to return',
      options: [
        { label: 'Full Response', value: 'full' },
        { label: 'Data Only', value: 'data' },
        { label: 'Status Only', value: 'status' }
      ],
      default: 'data'
    },
    {
      key: 'retryCount',
      type: 'number',
      label: 'Retry Count',
      description: 'Number of times to retry if the request fails',
      min: 0,
      max: 10,
      default: 3
    },
    {
      key: 'retryDelay',
      type: 'number',
      label: 'Retry Delay (ms)',
      description: 'Delay between retry attempts in milliseconds',
      min: 100,
      max: 10000,
      default: 1000
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Request timeout in milliseconds',
      min: 100,
      max: 30000,
      default: 5000
    }
  ],
  
  // Data validation schema
  // CUSTOMIZE THIS: Update validation to match your settings
  validation: z.object({
    destinationUrl: z.string()
      .url({ message: "Please enter a valid URL" })
      .optional(),
    method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
    headers: z.string().optional().transform(value => {
      try {
        return value ? JSON.parse(value) : {};
      } catch {
        return {};
      }
    }),
    formatOutput: z.union([
      z.boolean().default(true), 
      z.enum(['true', 'false']).transform(val => val === 'true')
    ]).default(true),
    responseMode: z.enum(['full', 'data', 'status']).default('data'),
    retryCount: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(100).max(10000).default(1000),
    timeout: z.number().min(100).max(30000).default(5000)
  })
};

export default definition;