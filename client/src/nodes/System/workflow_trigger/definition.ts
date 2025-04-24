/**
 * Workflow Trigger Node Definition
 * 
 * This node allows triggering another workflow from within the current workflow,
 * enabling modular workflow design and orchestration.
 */

import { NodeDefinition } from '@/nodes/types';
import { defaultData } from './executor';

export const definition: NodeDefinition = {
  type: 'workflow_trigger',
  name: 'Workflow Trigger',
  description: 'Triggers another workflow from within a workflow, allowing for modular workflow design',
  category: 'actions',
  version: '1.0.0',
  icon: 'git-branch',  // Use string icon identifier instead of React component
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
  // We'll use custom UI for workflow selection instead of simple configOptions
  defaultData
};

export default definition;