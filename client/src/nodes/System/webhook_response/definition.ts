/**
 * Send to Webhook Node Definition
 * 
 * This node sends workflow data to an external webhook endpoint or API.
 */

import { z } from 'zod';

import { Send } from 'lucide-react';

// Default configuration for the node
const defaultData = {
  url: '',
  method: 'POST',
  headers: '',
  retryCount: 3,
  retryDelay: 1000,
  timeout: 5000
};

const definition = {
  type: 'webhook_response',
  name: 'Send to Webhook',
  description: 'Sends data from your workflow to an external webhook URL or API endpoint',
  category: 'actions',
  icon: Send,
  version: '1.0.0',
  defaultData: defaultData,
  inputs: {
    data: {
      type: 'any',
      description: 'Data to send to the webhook endpoint',
      required: true
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
  settings: [
    {
      key: 'url',
      type: 'string',
      label: 'Webhook URL',
      description: 'URL of the external webhook endpoint',
      placeholder: 'https://example.com/webhook',
      required: true
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
      key: 'headers',
      type: 'json',
      label: 'Custom Headers',
      description: 'Custom HTTP headers to include in the request (JSON format)',
      placeholder: '{"Content-Type": "application/json", "Authorization": "Bearer your-token"}',
      required: false
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
  validation: z.object({
    url: z.string().url({ message: "Please enter a valid URL" }),
    method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
    headers: z.string().optional().transform(value => {
      try {
        return value ? JSON.parse(value) : {};
      } catch {
        return {};
      }
    }),
    retryCount: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(100).max(10000).default(1000),
    timeout: z.number().min(100).max(30000).default(5000)
  })
};

export default definition;