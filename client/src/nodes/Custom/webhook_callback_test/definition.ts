/**
 * Webhook Callback Test Node Definition
 * 
 * This node allows testing webhook callbacks by sending test data to a specified URL
 */

import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  type: 'webhook_callback_test',
  name: 'Webhook Callback Test',
  description: 'Tests webhook callbacks by sending data to a URL',
  icon: 'webhook',
  category: 'utility',
  version: '1.0.0',
  isCustom: true,
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
      label: 'Callback URL',
      description: 'The URL to send the webhook callback to',
      default: '',
      required: true
    },
    {
      key: 'method',
      type: 'select',
      label: 'HTTP Method',
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
      label: 'Content Type',
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
      label: 'Use Input Data',
      description: 'If true, uses the data from the input port. Otherwise, uses the template data.',
      default: false
    },
    {
      key: 'templateData',
      type: 'json',
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
}`
    },
    {
      key: 'includeAuthToken',
      type: 'boolean',
      label: 'Include Auth Token',
      description: 'Whether to include an authorization token in the request',
      default: false
    },
    {
      key: 'authToken',
      type: 'string',
      label: 'Authorization Token',
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
    includeAuthToken: false,
    templateData: `{
  "searchId": "test-${Date.now()}",
  "status": "in_progress",
  "stage": "COMPANY_OVERVIEW",
  "progress": 10,
  "timestamp": "${new Date().toISOString()}"
}`
  }
};

export default definition;