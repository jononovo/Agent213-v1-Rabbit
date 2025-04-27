/**
 * Embed Other Workflow Node Definition
 * 
 * This node allows triggering another workflow from within the current workflow,
 * enabling modular workflow design and orchestration.
 */

import { NodeDefinition } from '@/nodes/types';

// Default data (duplicated here to avoid circular dependency)
const defaultData = {
  workflowId: null,
  inputField: 'json',
  timeout: 30000,
  waitForCompletion: true
};

export const definition: NodeDefinition = {
  type: 'embed_other_workflow',
  name: 'Embed Other Workflow',
  description: 'Trigger and optionally wait for another workflow to complete',
  category: 'actions',
  version: '1.0.0',
  icon: 'GitBranch',
  defaultData: defaultData,
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to send to the triggered workflow'
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Result data from the executed workflow'
    }
  }
};

export default definition;