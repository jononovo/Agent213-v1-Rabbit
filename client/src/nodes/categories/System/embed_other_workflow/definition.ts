import { NodeDefinition } from '../../types';

const definition: NodeDefinition = {
  type: 'embed_other_workflow',
  name: 'Embed Other Workflow',
  description: 'This node triggers another workflow from within your current workflow. Select the workflow to call, specify which input field to use as the input data, and set a timeout if needed.',
  category: 'actions',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to pass to the embedded workflow'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Output data from the embedded workflow'
    }
  },
  settings: [
    {
      key: 'workflowId',
      label: 'Target Workflow',
      type: 'select',
      placeholder: 'Select target workflow',
      description: 'The workflow that will be triggered by this node.',
      options: [] // Will be populated dynamically with available workflows
    },
    {
      key: 'inputField',
      label: 'Input Field',
      type: 'text',
      placeholder: 'Enter input field name',
      description: 'The field from input data to use as the input for the workflow.'
    },
    {
      key: 'timeout',
      label: 'Timeout (ms)',
      type: 'text',
      placeholder: '30000',
      description: 'Maximum time in milliseconds to wait for workflow response. Default: 30000 (30 seconds)'
    }
  ]
};

export default definition;