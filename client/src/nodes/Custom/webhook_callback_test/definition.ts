/**
 * Webhook Callback Test Node Definition
 * 
 * This node allows testing webhook callbacks by sending test data to a specified URL
 */

import { NodeDefinition } from '@/nodes/types';

/**
 * Node definition object
 */
export const definition: NodeDefinition = {
  type: 'webhook_callback_test',
  category: 'utility',
  name: 'Webhook Callback Test',
  description: 'Tests webhook callbacks by sending data to a URL',
  icon: 'webhook',
  version: '1.0.0',
  inputs: {
    url: {
      type: 'string',
      description: 'The URL to send the webhook callback to'
    },
    data: {
      type: 'object',
      description: 'The data to send in the webhook callback'
    },
    headers: {
      type: 'object',
      description: 'Headers to include in the request'
    }
  },
  outputs: {
    result: {
      type: 'object',
      description: 'The result of the webhook callback'
    }
  },
  configOptions: [
    {
      key: 'url',
      type: 'string',
      displayName: 'Callback URL',
      description: 'The URL to send the webhook callback to',
      default: '',
      required: true
    },
    {
      key: 'method',
      type: 'select',
      displayName: 'HTTP Method',
      description: 'The HTTP method to use for the request',
      default: 'POST',
      options: [
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' }
      ]
    },
    {
      key: 'contentType',
      type: 'select',
      displayName: 'Content Type',
      description: 'The content type of the request',
      default: 'application/json',
      options: [
        { value: 'application/json', label: 'application/json' },
        { value: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded' }
      ]
    },
    {
      key: 'useInputData',
      type: 'boolean',
      displayName: 'Use Input Data',
      description: 'If true, uses the data from the input port. Otherwise, uses the template data.',
      default: false
    },
    {
      key: 'templateData',
      type: 'code',
      language: 'json',
      displayName: 'Template Data',
      description: 'The template data to send in JSON format',
      default: `{
  "searchId": "test-${Date.now()}",
  "status": "in_progress",
  "stage": "COMPANY_OVERVIEW",
  "progress": 10,
  "timestamp": "${new Date().toISOString()}",
  "results": {
    "companies": [],
    "metadata": {
      "moduleType": "COMPANY_OVERVIEW",
      "completedSearches": [],
      "validationScores": {}
    }
  }
}`
    },
    {
      key: 'includeAuthToken',
      type: 'boolean',
      displayName: 'Include Auth Token',
      description: 'Whether to include an authorization token in the request',
      default: false
    },
    {
      key: 'authToken',
      type: 'string',
      displayName: 'Authorization Token',
      description: 'The token to include in the Authorization header (Bearer token)',
      default: '',
      visible: { includeAuthToken: true }
    }
  ],
  defaultData: {
    url: '',
    method: 'POST',
    contentType: 'application/json',
    useInputData: false,
    includeAuthToken: false
  }
};

// Define interface for input/output connections
export const interfaceDefinition: NodeInterfaceDefinition = {
  inputs: {
    url: {
      type: 'string',
      description: 'The URL to send the webhook callback to',
      isArray: false,
      optional: false
    },
    data: {
      type: 'object',
      description: 'The data to send in the webhook callback',
      isArray: false,
      optional: true
    },
    headers: {
      type: 'object',
      description: 'Headers to include in the request',
      isArray: false,
      optional: true
    }
  },
  outputs: {
    result: {
      type: 'object',
      description: 'The result of the webhook callback',
      isArray: false
    }
  }
};

// Define settings for the webhook callback test node
export const settingsDefinition = {
  url: {
    type: 'string',
    label: 'Callback URL',
    description: 'The URL to send the webhook callback to',
    default: '',
    required: true
  },
  method: {
    type: 'select',
    label: 'HTTP Method',
    description: 'The HTTP method to use for the request',
    default: 'POST',
    options: [
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'PATCH', value: 'PATCH' }
    ],
    required: true
  },
  contentType: {
    type: 'select',
    label: 'Content Type',
    description: 'The content type of the request',
    default: 'application/json',
    options: [
      { label: 'application/json', value: 'application/json' },
      { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' }
    ],
    required: true
  },
  useInputData: {
    type: 'boolean',
    label: 'Use Input Data',
    description: 'If true, uses the data from the input port. Otherwise, uses the template data.',
    default: false
  },
  templateData: {
    type: 'code',
    label: 'Template Data',
    description: 'The template data to send in JSON format',
    default: `{
  "searchId": "test-${Date.now()}",
  "status": "in_progress",
  "stage": "COMPANY_OVERVIEW",
  "progress": 10,
  "timestamp": "${new Date().toISOString()}",
  "results": {
    "companies": [],
    "metadata": {
      "moduleType": "COMPANY_OVERVIEW",
      "completedSearches": [],
      "validationScores": {}
    }
  }
}`,
    language: 'json'
  },
  includeAuthToken: {
    type: 'boolean',
    label: 'Include Auth Token',
    description: 'Whether to include an authorization token in the request',
    default: false
  },
  authToken: {
    type: 'string',
    label: 'Authorization Token',
    description: 'The token to include in the Authorization header (Bearer token)',
    default: '',
    visible: { includeAuthToken: true }
  }
};