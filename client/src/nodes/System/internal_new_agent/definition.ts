import { NodeDefinition } from '../../types';

const definition: NodeDefinition = {
  type: 'internal_new_agent',
  name: 'New Agent Trigger',
  description: 'This node triggers when a user clicks the "New Agent" button in the UI. Configure the template settings and default behavior when creating new agents.',
  category: 'actions',
  version: '1.0.0',
  inputs: {},  // No inputs as this is a trigger node
  outputs: {
    agent: {
      type: 'object',
      description: 'New agent data'
    }
  },
  settings: [
    {
      key: 'agentTemplate',
      label: 'Agent Template',
      type: 'select',
      placeholder: 'Select an agent template',
      description: 'Optional template to use as a base for the new agent.',
      options: [
        { value: 'blank', label: 'Blank Agent' },
        { value: 'customer-support', label: 'Customer Support Agent' },
        { value: 'data-analysis', label: 'Data Analysis Agent' },
        { value: 'content-creation', label: 'Content Creation Agent' }
      ]
    },
    {
      key: 'defaultWorkflow',
      label: 'Default Workflow',
      type: 'select',
      placeholder: 'Create default workflow?',
      description: 'Automatically create a starter workflow for the new agent',
      options: [
        { value: 'none', label: 'No Default Workflow' },
        { value: 'basic-chat', label: 'Basic Chat Workflow' },
        { value: 'data-processing', label: 'Data Processing Workflow' },
        { value: 'custom', label: 'Custom Template' }
      ]
    },
    {
      key: 'autoActivate',
      label: 'Auto-Activate',
      type: 'select',
      placeholder: 'Automatically activate the agent?',
      description: 'Set the agent as active immediately after creation.',
      options: [
        { value: 'true', label: 'Yes - Activate Immediately' },
        { value: 'false', label: 'No - Manual Activation' }
      ]
    },
    {
      key: 'sendWelcomeMessage',
      label: 'Welcome Message',
      type: 'textarea',
      placeholder: 'Enter a welcome message to display when the agent is created...',
      description: 'Optional message to show upon successful agent creation.'
    }
  ]
};

export default definition;