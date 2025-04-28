/**
 * Response Message Node Definition
 * 
 * This node provides conditional response message generation based on input conditions.
 */

import { NodeDefinition, NodeSetting } from '@/nodes/types';
import { z } from 'zod';

// Default configuration for the node
export const defaultData = {
  successMessage: 'Operation completed successfully.',
  errorMessage: 'An error occurred during the operation.',
  conditionField: 'status',
  successValue: 'success'
};

const definition: NodeDefinition = {
  type: 'response_message',
  name: 'Response Message',
  description: 'Generates conditional response messages based on input conditions',
  icon: 'message-circle',
  category: 'text',
  version: '1.0.0',
  inputs: {
    data: {
      type: 'object',
      description: 'Input data containing condition field'
    }
  },
  outputs: {
    message: {
      type: 'string',
      description: 'Generated response message'
    },
    success: {
      type: 'boolean',
      description: 'Whether condition was met'
    }
  },
  defaultData: defaultData,
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'successMessage',
      type: 'textarea',
      label: 'Success Message',
      description: 'Message to display when the operation is successful.',
      placeholder: 'Enter success message...'
    },
    {
      key: 'errorMessage',
      type: 'textarea',
      label: 'Error Message',
      description: 'Message to display when there is an error.',
      placeholder: 'Enter error message...'
    },
    {
      key: 'conditionField',
      type: 'text',
      label: 'Condition Field',
      description: 'The input field to check for success/error determination.',
      placeholder: 'e.g., result, status, success'
    },
    {
      key: 'successValue',
      type: 'text',
      label: 'Success Value',
      description: 'The value that indicates success in the condition field.',
      placeholder: 'e.g., success, true, 1'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    successMessage: z.string().min(1),
    errorMessage: z.string().min(1),
    conditionField: z.string().min(1),
    successValue: z.string()
  })
};

export default definition;