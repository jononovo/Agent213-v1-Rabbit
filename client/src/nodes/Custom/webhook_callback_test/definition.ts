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
    }
  ],
  defaultData: {
    url: '',
    method: 'POST',
    contentType: 'application/json'
  }
};

export default definition;