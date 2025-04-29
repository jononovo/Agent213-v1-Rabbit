/**
 * Webhook Integration Node Template
 * 
 * This template creates a webhook endpoint that can be called by external systems
 * to trigger a workflow or receive data.
 * 
 * How to use this template:
 * 1. Copy this folder to your desired location (e.g., Integration/my_webhook)
 * 2. Rename the node type in this file
 * 3. Customize the settings, inputs, and outputs as needed
 * 4. Update the executor.ts and ui.tsx files accordingly
 */

import { z } from 'zod';

import { Webhook } from 'lucide-react';

// Default configuration for the node
// CUSTOMIZE THIS: Set default values for your webhook node
const defaultData = {
  path: '',              // Custom path segment in the URL
  secret: '',            // Secret key for webhook verification (if needed)
  authType: 'none',      // Authentication type (none, apiKey, bearer)
  methods: ['POST']      // Default HTTP methods to accept
};

// Main node definition
// CUSTOMIZE THIS: Update the properties to match your node's purpose
const definition = {
  type: 'my_webhook_node',                // CHANGE THIS: Set a unique node type identifier
  name: 'My Webhook Node',                // CHANGE THIS: Set a human-readable name
  description: 'Creates a webhook endpoint that can receive data from external systems',
  category: 'integration',                // Recommended to keep this as 'integration' for webhook nodes
  icon: Webhook,                          // You can change to a different icon from lucide-react
  version: '1.0.0',
  defaultData: defaultData,
  
  // Input ports - typically empty for trigger nodes
  // Add inputs if your webhook should process data from previous nodes
  inputs: {},
  
  // Output ports - data emitted by this node
  // CUSTOMIZE THIS: Define what data your webhook provides to downstream nodes
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
  
  // Integration Engine configuration - REQUIRED for integration nodes
  // This tells the Integration Engine how to manage this node
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // This node provides an HTTP endpoint
      webhook: true,      // This node acts as a webhook receiver
      scheduler: false    // Set to true if this node provides scheduling capabilities
    },
    
    // What the node needs from the system
    requires: {
      storage: true,       // Set to true if the node needs persistent storage
      authentication: false // Set to true if the node requires authentication
    },
    
    // Endpoint configuration
    endpoint: {
      pathTemplate: 'webhooks/:path',  // URL path template with parameters
      methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Supported HTTP methods
      authTypes: ['none', 'apiKey', 'bearer']     // Supported auth methods
    }
  },
  
  // UI settings that appear in the node configuration panel
  // CUSTOMIZE THIS: Define settings for your webhook node
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
  
  // Zod validation schema for settings
  // CUSTOMIZE THIS: Update this schema to match your settings
  validation: z.object({
    path: z.string().optional(),
    secret: z.string().optional(),
    authType: z.enum(['none', 'apiKey', 'bearer']).default('none'),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE'])).default(['POST'])
  })
};

export default definition;