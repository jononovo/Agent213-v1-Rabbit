/**
 * Embed Workflow Node Implementation
 * 
 * This node allows users to embed and run another workflow
 * within their current workflow.
 * It provides a BaseNode-wrapped implementation.
 */

import EmbedWorkflowNode, { defaultData as uiDefaultData } from './ui';
import { execute } from './executor';

// Default data for the node
export const defaultData = {
  label: 'Embed Workflow',
  description: 'Run another workflow from within this workflow',
  icon: 'git-branch',
  category: 'actions',
  workflowId: null,
  inputField: 'json',
  timeout: 30000,
  waitForCompletion: true,
  // By default, use the BaseNode wrapper for consistent UI
  useBaseNodeWrapper: true
};

// Validator function to ensure the node is properly configured
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.workflowId && !(data.settings && data.settings.workflowId)) {
    errors.push('Workflow ID is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Export the component for use in the workflow editor
export const component = EmbedWorkflowNode;

// Export the executor function
export { execute };

export default EmbedWorkflowNode;