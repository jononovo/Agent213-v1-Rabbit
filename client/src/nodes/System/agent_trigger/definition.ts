/**
 * Agent Trigger Node Definition
 * 
 * This node triggers agent or workflow execution from the current workflow.
 */

import { NodeDefinition, NodeSetting } from '@/nodes/types';
import { z } from 'zod';

// Default configuration for the node
export const defaultData = {
  triggerType: 'agent',
  agentId: '',
  workflowId: '',
  promptField: 'prompt',
  timeout: '30000'
};

const definition: NodeDefinition = {
  type: 'agent_trigger',
  name: 'Agent Trigger',
  description: 'Triggers an agent or workflow execution',
  icon: 'bot',
  category: 'actions',
  version: '1.0.0',
  inputs: {
    data: {
      type: 'object',
      description: 'Input data containing prompt field'
    }
  },
  outputs: {
    result: {
      type: 'object',
      description: 'Result from agent or workflow execution'
    }
  },
  defaultData: defaultData,
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'triggerType',
      type: 'radio',
      label: 'Trigger Type',
      description: 'Choose whether to trigger an agent or a workflow.',
      options: [
        { value: 'agent', label: 'Agent' },
        { value: 'workflow', label: 'Workflow' }
      ],
      default: 'agent'
    },
    {
      key: 'agentId',
      type: 'select',
      label: 'Target Agent',
      description: 'The agent that will be triggered by this node.',
      placeholder: 'Select target agent',
      options: [], // Will be populated dynamically with available agents
      showWhen: (settings) => !settings.triggerType || settings.triggerType === 'agent'
    },
    {
      key: 'workflowId',
      type: 'select',
      label: 'Target Workflow',
      description: 'The workflow that will be triggered by this node.',
      placeholder: 'Select target workflow',
      options: [], // Will be populated dynamically with available workflows
      showWhen: (settings) => settings.triggerType === 'workflow'
    },
    {
      key: 'promptField',
      type: 'text',
      label: 'Prompt Field',
      description: 'The field from input data to use as the prompt for the agent or workflow.',
      placeholder: 'Enter prompt field name'
    },
    {
      key: 'timeout',
      type: 'text',
      label: 'Timeout (ms)',
      description: 'Maximum time in milliseconds to wait for agent response. Default: 30000 (30 seconds)',
      placeholder: '30000'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    triggerType: z.enum(['agent', 'workflow']).default('agent'),
    agentId: z.string().optional(),
    workflowId: z.string().optional(),
    promptField: z.string().default('prompt'),
    timeout: z.string().default('30000')
  })
};

export default definition;