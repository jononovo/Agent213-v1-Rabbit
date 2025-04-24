/**
 * Workflow Runner Node Definition
 * 
 * This node allows running another workflow as a part of the current workflow,
 * enabling workflow composition and reuse.
 */

import { NodeDefinition } from '@/nodes/types';
import { defaultData } from './executor';

export const definition: NodeDefinition = {
  type: 'workflow_runner',
  name: 'Workflow Runner',
  description: 'Runs another workflow within the current workflow',
  icon: 'workflow',
  category: 'advanced',
  version: '1.0.0',
  inputs: {
    input: {
      type: 'any',
      description: 'Input data to pass to the workflow'
    },
    // Additional dynamic inputs can be added based on target workflow
  },
  outputs: {
    result: {
      type: 'any',
      description: 'Result from the executed workflow'
    },
    error: {
      type: 'string',
      description: 'Error message if workflow execution failed',
      optional: true
    }
  },
  // Add defaultData property required by the validator
  defaultData: defaultData
};

export default definition;