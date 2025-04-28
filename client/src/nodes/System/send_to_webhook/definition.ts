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

// Default configuration for the node
const defaultData = {
  url: '',
  method: 'POST',
  headers: '',
  retryCount: 3,
  retryDelay: 1000,
  timeout: 5000,
  isWebhookResponse: 'false' // New option to respond to original webhook, stored as string for radio
};

const definition = {
  type: 'send_to_webhook',
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
  // Define fields for the node's settings drawer
  settings: [
    {
      key: 'isWebhookResponse',
      type: 'radio',
      label: 'Respond to Original Webhook',
      description: 'When enabled, this node will respond to the original webhook request instead of making a new outbound request',
      options: [
        { label: 'Yes - Respond to the original webhook request', value: 'true' },
        { label: 'No - Send to a new external webhook URL', value: 'false' }
      ],
      default: 'false'
    },
    {
      key: 'url',
      type: 'string',
      label: 'Webhook URL',
      description: 'URL of the external webhook endpoint (not required if responding to original webhook)',
      placeholder: 'https://example.com/webhook',
      required: false,
      showIf: { key: 'isWebhookResponse', value: 'false' }
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
      default: 'POST',
      showIf: { key: 'isWebhookResponse', value: 'false' }
    },
    {
      key: 'headers',
      type: 'json',
      label: 'Custom Headers',
      description: 'Custom HTTP headers to include in the request (JSON format)',
      placeholder: '{"Content-Type": "application/json", "Authorization": "Bearer your-token"}',
      required: false,
      showIf: { key: 'isWebhookResponse', value: 'false' }
    },
    {
      key: 'retryCount',
      type: 'number',
      label: 'Retry Count',
      description: 'Number of times to retry if the request fails',
      min: 0,
      max: 10,
      default: 3,
      showIf: { key: 'isWebhookResponse', value: 'false' }
    },
    {
      key: 'retryDelay',
      type: 'number',
      label: 'Retry Delay (ms)',
      description: 'Delay between retry attempts in milliseconds',
      min: 100,
      max: 10000,
      default: 1000,
      showIf: { key: 'isWebhookResponse', value: 'false' }
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Request timeout in milliseconds',
      min: 100,
      max: 30000,
      default: 5000,
      showIf: { key: 'isWebhookResponse', value: 'false' }
    }
  ],
  // Data validation schema
  validation: z.object({
    isWebhookResponse: z.union([
      z.boolean().default(false), 
      z.enum(['true', 'false']).transform(val => val === 'true')
    ]),
    url: z.string()
      .url({ message: "Please enter a valid URL" })
      .optional()
      .refine((url, ctx) => {
        // URL is only required if we're not responding to the original webhook
        const isResponse = ctx.parent.isWebhookResponse;
        return url || (typeof isResponse === 'string' ? isResponse === 'true' : isResponse === true);
      }, { message: "URL is required when not responding to original webhook" }),
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