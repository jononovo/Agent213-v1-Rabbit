/**
 * API Response Message Node Definition
 * 
 * This node provides conditional API response message generation for the chat UI.
 */

import { NodeDefinition, NodeSetting } from '@/nodes/types';
import { z } from 'zod';

// Default configuration for the node
export const defaultData = {
  successMessage: 'Operation completed successfully.',
  errorMessage: 'An error occurred during the operation.',
  conditionField: 'status',
  successValue: 'success',
  targetEndpoint: '/api/chat',
  formatOutput: 'true'
};

const definition: NodeDefinition = {
  type: 'api_response_message',
  name: 'API Response Message',
  description: 'Generates conditional API response messages for chat UI',
  icon: 'message-square-dots',
  category: 'actions',
  version: '1.0.0',
  inputs: {
    data: {
      type: 'object',
      description: 'Input data containing condition field'
    }
  },
  outputs: {
    response: {
      type: 'object',
      description: 'API response object'
    },
    formatted: {
      type: 'boolean',
      description: 'Whether the message was formatted for chat UI',
      optional: true
    }
  },
  defaultData: defaultData,
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'successMessage',
      type: 'textarea',
      label: 'Success Message',
      description: 'Message to display when the condition is met (success case). Supports template variables like {{agent.id}}.',
      placeholder: 'Enter success message'
    },
    {
      key: 'errorMessage',
      type: 'textarea',
      label: 'Error Message',
      description: 'Message to display when the condition is not met (error case). Supports template variables like {{agent.id}}.',
      placeholder: 'Enter error message'
    },
    {
      key: 'conditionField',
      type: 'text',
      label: 'Condition Field',
      description: 'Field in the input data to check for success/failure. Use "true" for always success.',
      placeholder: 'e.g., status, success, true'
    },
    {
      key: 'successValue',
      type: 'text',
      label: 'Success Value',
      description: 'The value that indicates success in the condition field. Use "true" for always success.',
      placeholder: 'e.g., success, true, 1'
    },
    {
      key: 'targetEndpoint',
      type: 'text',
      label: 'Target Endpoint',
      description: 'API endpoint to send the message to. Default is /api/chat for the chat UI.',
      placeholder: '/api/chat'
    },
    {
      key: 'formatOutput',
      type: 'radio',
      label: 'Format for Chat UI',
      description: 'Format the output specifically for the chat UI.',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ],
      default: 'true'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    successMessage: z.string().min(1),
    errorMessage: z.string().min(1),
    conditionField: z.string().min(1),
    successValue: z.string(),
    targetEndpoint: z.string().default('/api/chat'),
    formatOutput: z.enum(['true', 'false']).default('true')
  })
};

export default definition;