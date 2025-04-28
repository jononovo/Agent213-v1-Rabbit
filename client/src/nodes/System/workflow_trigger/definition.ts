/**
 * Workflow Trigger Node Definition
 * 
 * This node allows triggering another workflow from within the current workflow,
 * enabling modular workflow design and orchestration.
 */

import { GitBranch } from 'lucide-react';

// Default configuration for the node
const defaultData = {
  workflowId: null,
  inputField: 'json',
  timeout: 30000,
  waitForCompletion: true
};

const definition = {
  type: 'workflow_trigger',
  name: 'Workflow Trigger',
  description: 'Triggers another workflow from within a workflow, allowing for modular workflow design',
  category: 'actions',
  version: '1.0.0',
  icon: GitBranch,
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to pass to the triggered workflow'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Output data received from the triggered workflow'
    },
    error: {
      type: 'string',
      description: 'Error message if workflow execution failed'
    }
  },
  defaultData: defaultData
};

export default definition;