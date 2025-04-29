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

import { NodeDefinition } from '../../nodes/types';
import { z } from 'zod';

const definition: NodeDefinition = {
  type: 'output_node',
  name: 'Output Node',
  description: 'Sends data to external systems',
  category: 'output',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'any',
      description: 'Data to be sent as output'
    }
  },
  outputs: {
    success: {
      type: 'boolean',
      description: 'Whether the output operation succeeded'
    },
    response: {
      type: 'any',
      description: 'Response data from the external system (if any)'
    },
    error: {
      type: 'string',
      description: 'Error message if the output operation failed'
    }
  },
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'outputType',
      type: 'select',
      label: 'Output Type',
      description: 'The type of output destination',
      options: [
        { value: 'webhook', label: 'Webhook' },
        { value: 'api', label: 'API Endpoint' },
        { value: 'database', label: 'Database' },
        { value: 'file', label: 'File' },
        { value: 'console', label: 'Console (for testing)' }
      ],
      default: 'webhook'
    },
    {
      key: 'destination',
      type: 'text',
      label: 'Destination URL',
      description: 'URL or destination path for the output',
      placeholder: 'https://example.com/api/webhook'
    },
    {
      key: 'method',
      type: 'select',
      label: 'HTTP Method',
      description: 'Method to use for API/webhook calls',
      options: [
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' },
        { value: 'DELETE', label: 'DELETE' }
      ],
      default: 'POST',
      showWhen: { field: 'outputType', values: ['webhook', 'api'] }
    },
    {
      key: 'headers',
      type: 'json',
      label: 'Headers',
      description: 'HTTP headers to include in the request',
      placeholder: '{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer TOKEN"\n}',
      showWhen: { field: 'outputType', values: ['webhook', 'api'] }
    },
    {
      key: 'transform',
      type: 'textarea',
      label: 'Transform Data',
      description: 'Optional JavaScript code to transform data before sending',
      placeholder: 'function transform(data) {\n  // Transform the data\n  return data;\n}'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    outputType: z.enum(['webhook', 'api', 'database', 'file', 'console']).default('webhook'),
    destination: z.string().optional(),
    method: z.enum(['POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
    headers: z.string().optional(),
    transform: z.string().optional()
  }),
  
  defaultData: {
    label: 'Output',
    description: 'Sends data to external system',
    outputType: 'webhook',
    destination: '',
    method: 'POST',
    headers: '{\n  "Content-Type": "application/json"\n}',
    transform: ''
  },
  icon: 'external-link'
};

export default definition;