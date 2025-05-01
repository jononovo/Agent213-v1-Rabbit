/**
 * Webhook Trigger Node Definition
 * 
 * This node creates a webhook endpoint that can be called by external systems
 * to trigger the workflow.
 */

import { z } from 'zod';

import { Webhook } from 'lucide-react';

// Default configuration for the node
const defaultData = {
  path: '',
  secret: '',
  authType: 'none',
  methods: ['POST']
};

const definition = {
  type: 'webhook_trigger',
  name: 'Webhook Trigger',
  description: 'Creates a webhook URL that can trigger this workflow when called from external systems',
  category: 'actions',
  icon: Webhook,
  version: '1.0.0',
  defaultData: defaultData,
  inputs: {},
  outputs: {
    payload: {
      type: 'object',
      description: 'The payload received from the webhook call'
    },
    headers: {
      type: 'object',
      description: 'HTTP headers from the webhook request'
    },
    method: {
      type: 'string',
      description: 'HTTP method used in the webhook request'
    }
  },
  // Integration Engine configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // This node provides an HTTP endpoint
      webhook: true,      // This node acts as a webhook receiver
      scheduler: false    // This node doesn't provide scheduling
    },
    
    // What the node needs from the system
    requires: {
      storage: true,       // Needs persistent storage for webhook configuration
      authentication: false // Authentication is optional
    },
    
    // Endpoint configuration
    endpoint: {
      pathTemplate: 'webhooks/:path',  // URL path template with parameters
      methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Supported HTTP methods
      authTypes: ['none', 'apiKey', 'bearer']     // Supported auth methods
    }
  },
  settings: [
    {
      key: 'path',
      type: 'string',
      label: 'Webhook Path',
      description: 'Custom path for the webhook URL (optional)',
      placeholder: 'my-custom-endpoint',
      required: false
    },
    {
      key: 'secret',
      type: 'string',
      label: 'Secret Key',
      description: 'Secret key for validating webhook requests',
      placeholder: 'your-secret-key',
      required: false
    },
    {
      key: 'authType',
      type: 'select',
      label: 'Authentication Type',
      description: 'Method of authentication for the webhook',
      options: [
        { label: 'None', value: 'none' },
        { label: 'API Key', value: 'apiKey' },
        { label: 'Bearer Token', value: 'bearer' }
      ],
      default: 'none'
    },
    {
      key: 'methods',
      type: 'multiselect',
      label: 'Allowed HTTP Methods',
      description: 'HTTP methods this webhook will accept',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' }
      ],
      default: ['POST']
    }
  ],
  validation: z.object({
    path: z.string().optional(),
    secret: z.string().optional(),
    authType: z.enum(['none', 'apiKey', 'bearer']).default('none'),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE'])).default(['POST'])
  })
};

export default definition;