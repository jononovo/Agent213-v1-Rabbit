/**
 * Workflow Trigger Node Definition
 * 
 * This node allows triggering another workflow from within the current workflow,
 * enabling modular workflow design and orchestration.
 */

import { NodeDefinition } from '@/lib/types/workflow';

// Default data (duplicated here to avoid circular dependency)
const defaultData = {
  workflowId: null,
  inputField: 'json',
  timeout: 30000,
  waitForCompletion: true
};

export const definition: NodeDefinition = {
  type: 'workflow_trigger',
  displayName: 'Workflow Trigger',
  description: 'Trigger and optionally wait for another workflow to complete',
  category: 'actions',
  version: '1.0.0',
  icon: 'GitBranch',
  inputs: {
    input: {
      type: 'any',
      displayName: 'Input',
      description: 'Input data to send to the triggered workflow',
      required: true
    }
  },
  outputs: {
    output: {
      type: 'any',
      displayName: 'Output',
      description: 'Result data from the executed workflow'
    }
  }
};

export default definition;