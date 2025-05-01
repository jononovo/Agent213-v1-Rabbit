/**
 * Send to Webhook Node Definition
 * 
 * This node sends workflow data to an external webhook endpoint or API.
 * 
 * It can be used in two modes:
 * 1. Send data to a specific webhook URL
 * 2. Respond to the original webhook trigger request
 */

import { z } from 'zod';
import { Send } from 'lucide-react';
import { NodeDefinition } from '../../utils';

// Default configuration for the node
const defaultData = {
  url: '',
  method: 'POST',
  headers: '',
  retryCount: 3,
  retryDelay: 1000,
  timeout: 5000,
  respondToOriginal: 'false', // Using string 'false' to match select dropdown values
  contentType: 'application/json',
  errorHandling: 'fail'  // Options: 'fail', 'warn', 'ignore'
};

const definition: NodeDefinition = {
  type: 'send_to_webhook',
  name: 'Send to Webhook',
  description: 'Sends data from your workflow to an external webhook URL or API endpoint',
  category: 'actions',
  icon: Send as unknown as string,
  version: '1.0.0',
  defaultData: defaultData,
  inputs: {
    data: {
      type: 'any',
      description: 'Data to send to the webhook endpoint'
    }
  },
  outputs: {
    response: {
      type: 'object',
      description: 'Response received from the webhook endpoint'
    },
    status: {
      type: 'number',
      description: 'HTTP status code from the webhook response'
    }
  },
  // Define fields for the node's settings drawer
  settings: [
    {
      key: 'respondToOriginal',
      type: 'select',
      label: 'Response Mode',
      description: 'Choose whether to send data to a new webhook or respond to the original request',
      options: [
        { label: 'Send to a new webhook URL', value: 'false' },
        { label: 'Respond to the original webhook request', value: 'true' }
      ],
      default: 'false'
    },
    {
      key: 'url',
      type: 'string',
      label: 'Webhook URL',
      description: 'URL of the external webhook endpoint (can also be provided in input data)',
      placeholder: 'https://example.com/webhook',
      required: false
    },
    {
      key: 'method',
      type: 'select',
      label: 'HTTP Method',
      description: 'HTTP method to use for the webhook request',
      options: [
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' }
      ],
      default: 'POST'
    },
    {
      key: 'contentType',
      type: 'select',
      label: 'Content Type',
      description: 'Content type to use for the request body',
      options: [
        { label: 'application/json', value: 'application/json' },
        { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
        { label: 'text/plain', value: 'text/plain' }
      ],
      default: 'application/json'
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
      key: 'errorHandling',
      type: 'select',
      label: 'Error Handling',
      description: 'How to handle errors encountered during webhook execution',
      options: [
        { label: 'Fail workflow on error', value: 'fail' },
        { label: 'Log warning and continue', value: 'warn' },
        { label: 'Ignore errors', value: 'ignore' }
      ],
      default: 'fail'
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
  validation: z.object({
    respondToOriginal: z.union([
      z.boolean().default(false), 
      z.enum(['true', 'false']).transform(val => val === 'true')
    ]).default(false),
    url: z.string()
      .url({ message: "Please enter a valid URL" })
      .optional(),
    method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
    contentType: z.enum([
      'application/json', 
      'application/x-www-form-urlencoded', 
      'text/plain'
    ]).default('application/json'),
    headers: z.string().optional().transform(value => {
      try {
        return value ? JSON.parse(value) : {};
      } catch {
        return {};
      }
    }),
    errorHandling: z.enum(['fail', 'warn', 'ignore']).default('fail'),
    retryCount: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(100).max(10000).default(1000),
    timeout: z.number().min(100).max(30000).default(5000)
  })
};

export default definition;