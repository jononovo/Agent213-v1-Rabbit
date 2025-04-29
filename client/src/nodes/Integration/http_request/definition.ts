/**
 * HTTP Request Node Definition
 * Defines the HTTP request node's properties, appearance, and behavior
 */

import { NodeDefinition } from '@/nodes/types';

/**
 * HTTP Request Node Definition
 */
const definition: NodeDefinition = {
  type: 'http_request',
  name: 'HTTP Request',
  description: 'Make HTTP requests to external APIs and web services',
  category: 'integration',
  version: '1.0.0',
  icon: 'globe',
  
  inputs: {
    body: {
      type: 'object',
      description: 'Input data to use as the request body'
    },
    headers: {
      type: 'object',
      description: 'Headers to merge with the request'
    }
  },
  
  outputs: {
    response: {
      type: 'object',
      description: 'Full response object from the request'
    },
    data: {
      type: 'object',
      description: 'Response data (typically JSON)'
    },
    status: {
      type: 'number',
      description: 'HTTP status code of the response'
    }
  },
  
  configOptions: [
    {
      key: 'url',
      type: 'string',
      default: '',
      description: 'URL to send the request to'
    },
    {
      key: 'method',
      type: 'select',
      default: 'GET',
      description: 'HTTP method to use',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
        { value: 'HEAD', label: 'HEAD' },
        { value: 'OPTIONS', label: 'OPTIONS' }
      ]
    },
    {
      key: 'headers',
      type: 'json',
      default: { 'Content-Type': 'application/json' },
      description: 'Default headers to include with the request'
    },
    {
      key: 'body',
      type: 'string',
      default: '',
      description: 'Default request body (JSON string or other format)'
    },
    {
      key: 'timeout',
      type: 'number',
      default: 10000,
      description: 'Request timeout in milliseconds'
    }
  ],
  
  defaultData: {
    url: '',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: '',
    timeout: 10000
  },
  
  // Integration Engine configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: false,  // This node doesn't provide an endpoint
      webhook: false,   // This node doesn't act as a webhook
      connector: true   // This node connects to external systems
    },
    
    // What the node needs from the system
    requires: {
      storage: false,        // Doesn't need persistent storage
      authentication: false, // Authentication is handled per request
      proxy: true            // Can use system proxy if available
    }
  }
};

// Additional metadata for UI/rendering (optional)
export const nodeMetadata = {
  tags: ['integration', 'api', 'http', 'web', 'request'],
  color: '#0EA5E9' // Sky blue color
};

export default definition;