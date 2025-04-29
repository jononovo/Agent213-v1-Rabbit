/**
 * HTTP Request Node Schema
 * 
 * This file defines the inputs, outputs, and parameters for the HTTP request node.
 */

import { NodeSchema } from '../types';

const schema: NodeSchema = {
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
  parameters: {
    url: {
      type: 'string',
      description: 'URL to send the request to',
      required: true
    },
    method: {
      type: 'string',
      description: 'HTTP method to use',
      default: 'GET',
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
    headers: {
      type: 'object',
      description: 'Default headers to include with the request',
      default: { 'Content-Type': 'application/json' }
    },
    body: {
      type: 'string',
      description: 'Default request body (JSON string or other format)',
      default: ''
    },
    timeout: {
      type: 'number',
      description: 'Request timeout in milliseconds',
      default: 10000
    }
  }
};

export default schema;