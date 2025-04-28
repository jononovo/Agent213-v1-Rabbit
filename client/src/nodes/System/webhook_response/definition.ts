import { NodeDefinition } from '../../types';

const definition: NodeDefinition = {
  type: 'webhook_response',
  name: 'Webhook Response',
  description: 'This node sends a response back to the webhook caller. Configure the response format and status code.',
  category: 'actions',
  settings: [
    {
      key: 'url',
      label: 'Webhook URL',
      type: 'string',
      placeholder: 'https://example.com/webhook',
      description: 'URL of the external webhook endpoint',
      required: true
    },
    {
      key: 'method',
      label: 'HTTP Method',
      type: 'select',
      description: 'HTTP method to use for the webhook request',
      options: [
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' }
      ],
      default: 'POST'
    },
    {
      key: 'headers',
      label: 'Custom Headers',
      type: 'textarea',
      placeholder: '{"Content-Type": "application/json", "Authorization": "Bearer your-token"}',
      description: 'Custom HTTP headers to include in the request (JSON format)'
    },
    {
      key: 'retryCount',
      label: 'Retry Count',
      type: 'number',
      description: 'Number of times to retry if the request fails',
      min: 0,
      max: 10,
      default: 3
    },
    {
      key: 'retryDelay',
      label: 'Retry Delay (ms)',
      type: 'number',
      description: 'Delay between retry attempts in milliseconds',
      min: 100,
      max: 10000,
      default: 1000
    },
    {
      key: 'timeout',
      label: 'Timeout (ms)',
      type: 'number',
      description: 'Request timeout in milliseconds',
      min: 100,
      max: 30000,
      default: 5000
    }
  ]
};

export default definition;