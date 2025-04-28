/**
 * Internal Create Agent Node Definition
 * 
 * This node handles the creation of new agents within the workflow system.
 */

import { NodeDefinition, NodeSetting } from '@/nodes/types';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';

// Default configuration for the node
export const defaultData = {
  defaultAgentType: 'custom',
  defaultIcon: 'brain',
  notifyOnCreate: 'true',
  logLevel: 'standard'
};

const definition: NodeDefinition = {
  type: 'internal_create_agent',
  name: 'Create Agent',
  description: 'Creates a new agent within the system',
  icon: UserPlus,
  category: 'actions',
  version: '1.0.0',
  inputs: {
    data: {
      type: 'object',
      description: 'Agent creation parameters'
    }
  },
  outputs: {
    agent: {
      type: 'object',
      description: 'Created agent data'
    },
    status: {
      type: 'string',
      description: 'Creation status result'
    }
  },
  defaultData: defaultData,
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'defaultAgentType',
      type: 'select',
      label: 'Default Agent Type',
      description: 'The type of agent to create if not specified in the input.',
      options: [
        { value: 'custom', label: 'Custom Agent' },
        { value: 'specialized', label: 'Specialized Agent' },
        { value: 'system', label: 'System Agent' }
      ],
      default: 'custom'
    },
    {
      key: 'defaultIcon',
      type: 'text',
      label: 'Default Icon',
      description: 'Default icon to use if not specified in the input.',
      placeholder: 'e.g., brain'
    },
    {
      key: 'notifyOnCreate',
      type: 'select',
      label: 'Notification',
      description: 'Whether to show a notification when the agent is created.',
      options: [
        { value: 'true', label: 'Yes - Show Notification' },
        { value: 'false', label: 'No - Silent Creation' }
      ],
      default: 'true'
    },
    {
      key: 'logLevel',
      type: 'select',
      label: 'Logging Level',
      description: 'Level of detail for logging agent creation events.',
      options: [
        { value: 'minimal', label: 'Minimal' },
        { value: 'standard', label: 'Standard' },
        { value: 'verbose', label: 'Verbose' }
      ],
      default: 'standard'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    defaultAgentType: z.enum(['custom', 'specialized', 'system']).default('custom'),
    defaultIcon: z.string().default('brain'),
    notifyOnCreate: z.enum(['true', 'false']).default('true'),
    logLevel: z.enum(['minimal', 'standard', 'verbose']).default('standard')
  })
};

export default definition;