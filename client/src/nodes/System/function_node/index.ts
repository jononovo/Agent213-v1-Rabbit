/**
 * Function Node Implementation
 * 
 * This node allows users to define custom JavaScript functions
 * that transform input data and produce output.
 * It provides both BaseNode-wrapped and standalone implementations.
 */

import FunctionNode, { StandaloneFunctionNode, defaultData as uiDefaultData } from './ui';

// Default data for the node
export const defaultData = {
  label: 'Function',
  description: 'Custom JavaScript function that transforms data',
  icon: 'code',
  category: 'code',
  code: 'function process(input) {\n  // Your code here\n  return input;\n}',
  settingsData: {},
  // By default, use the BaseNode wrapper for consistent UI
  useBaseNodeWrapper: true
};

// Validator function to ensure the node is properly configured
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.settingsData?.code && !data.code) {
    errors.push('Function code is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Export the hybrid component for use in the workflow editor
export const component = FunctionNode;

// Also export the standalone component for direct use if needed
export const standaloneComponent = StandaloneFunctionNode;

export default FunctionNode;