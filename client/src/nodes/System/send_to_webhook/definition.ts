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
  isWebhookResponse: 'false' // Using string 'false' to match select dropdown values
};

// Define a showWhen function type to avoid TypeScript errors
type ShowWhenFn = (settings: Record<string, any>) => boolean;

// Function to check if we should show URL-related fields
const showIfNotWebhookResponse: ShowWhenFn = (settings: Record<string, any>) => {
  return settings.isWebhookResponse === 'false';
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
      type: 'select',
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
      type: 'text',
      label: 'Webhook URL',
      description: 'URL of the external webhook endpoint (not required if responding to original webhook)',
      placeholder: 'https://example.com/webhook',
      required: false,
      showWhen: showIfNotWebhookResponse
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
      showWhen: showIfNotWebhookResponse
    },
    {
      key: 'headers',
      type: 'textarea',
      label: 'Custom Headers',
      description: 'Custom HTTP headers to include in the request (JSON format)',
      placeholder: '{"Content-Type": "application/json", "Authorization": "Bearer your-token"}',
      required: false,
      showWhen: showIfNotWebhookResponse
    },
    {
      key: 'retryCount',
      type: 'number',
      label: 'Retry Count',
      description: 'Number of times to retry if the request fails',
      min: 0,
      max: 10,
      default: 3,
      showWhen: showIfNotWebhookResponse
    },
    {
      key: 'retryDelay',
      type: 'number',
      label: 'Retry Delay (ms)',
      description: 'Delay between retry attempts in milliseconds',
      min: 100,
      max: 10000,
      default: 1000,
      showWhen: showIfNotWebhookResponse
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (ms)',
      description: 'Request timeout in milliseconds',
      min: 100,
      max: 30000,
      default: 5000,
      showWhen: showIfNotWebhookResponse
    }
  ],
  // Data validation schema
  validation: z.object({
    isWebhookResponse: z.union([
      z.boolean().default(false), 
      z.enum(['true', 'false']).transform(val => val === 'true')
    ]).default(false),
    url: z.string()
      .url({ message: "Please enter a valid URL" })
      .optional(),
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