/**
 * API Integration Node Template
 * 
 * This template provides a foundation for creating nodes that integrate with external APIs.
 * It includes configurations for authentication, request handling, and error management.
 */

import { NodeDefinition } from '@/nodes/types';
import { z } from 'zod';
import { defaultData } from './executor';

/**
 * Node definition
 * CUSTOMIZE THIS: Update all properties to match your specific API integration
 */
export const definition: NodeDefinition = {
  type: 'my_api_node',              // CHANGE THIS: Set a unique node type identifier
  name: 'My API Integration',       // CHANGE THIS: Set a human-readable name
  description: 'Connect with an external API service',
  icon: 'globe',                    // You can change to a different icon from lucide-react
  category: 'integration',          // Recommended to keep this as 'integration' for API nodes
  version: '1.0.0',
  
  // Integration Engine configuration - REQUIRED for integration nodes
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: false,    // This node doesn't provide an HTTP endpoint
      webhook: false,     // This node doesn't act as a webhook receiver
      connector: true,    // This node connects to external API
      ai: false           // CUSTOMIZE THIS: Set to true if this is an AI service
    },
    
    // What the node needs from the system
    requires: {
      storage: false,        // CUSTOMIZE THIS: Set to true if you need persistent storage
      authentication: true,  // Most API nodes require authentication
      proxy: true            // Can use system proxy if available
    },
    
    // External API configuration
    externalApi: {
      baseUrl: 'https://api.example.com',  // CHANGE THIS: Set your API base URL
      defaultEndpoint: '/v1/resource',     // CHANGE THIS: Set default endpoint
      authType: 'apiKey',                  // Options: apiKey, bearer, basic, oauth
      documentation: 'https://docs.example.com'  // CHANGE THIS: Link to API docs
    }
  },
  
  // Define inputs for this node
  // CUSTOMIZE THIS: Define what inputs your API node accepts
  inputs: {
    data: {
      type: 'object',
      description: 'Data to send to the API'
    },
    parameters: {
      type: 'object',
      description: 'Additional parameters for the API request',
      optional: true
    }
  },
  
  // Define outputs for this node
  // CUSTOMIZE THIS: Define what outputs your API node produces
  outputs: {
    response: {
      type: 'object',
      description: 'API response data'
    },
    metadata: {
      type: 'object',
      description: 'Response metadata',
      optional: true
    }
  },
  
  // Add defaultData property required by the validator
  defaultData: defaultData,
  
  // Define settings for configuration panel
  // CUSTOMIZE THIS: Define settings specific to your API
  settings: [
    {
      key: 'apiKey',
      type: 'password',
      label: 'API Key',
      description: 'Your API key is securely stored and used only for this node.',
      placeholder: 'Enter your API key',
      required: false  // Set to true if it's always required
    },
    {
      key: 'endpoint',
      type: 'text',
      label: 'API Endpoint',
      description: 'The specific API endpoint to call',
      placeholder: '/v1/resource',
      default: '/v1/resource'
    },
    {
      key: 'method',
      type: 'select',
      label: 'HTTP Method',
      description: 'The HTTP method to use for the request',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' }
      ],
      default: 'POST'
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Request timeout in milliseconds',
      min: 1000,
      max: 60000,
      default: 10000
    }
  ],
  
  // Validation schema using Zod
  // CUSTOMIZE THIS: Update validation to match your settings
  validation: z.object({
    apiKey: z.string().optional(),
    endpoint: z.string().default('/v1/resource'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
    timeout: z.number().min(1000).max(60000).default(10000),
  })
};

export default definition;