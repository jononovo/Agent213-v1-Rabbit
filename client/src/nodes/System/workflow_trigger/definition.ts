/**
 * Workflow Trigger Node Definition
 * 
 * This node allows triggering another workflow from within the current workflow,
 * enabling modular workflow design and orchestration.
 */

import { NodeDefinition } from '@/lib/types/workflow';
import { defaultData } from './executor';

export const definition: NodeDefinition = {
  type: 'workflow_trigger',
  name: 'Workflow Trigger',
  description: 'Trigger and optionally wait for another workflow to complete',
  category: 'System',
  version: 1,
  documentationUrl: '/docs/nodes/workflow-trigger',
  icon: 'GitBranch',
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to send to the triggered workflow',
      isArray: false,
      optional: false
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'Result data from the executed workflow',
      isArray: false
    }
  },
  defaultData
};

export default definition;