/**
 * Workflow Trigger Node
 * 
 * Entry point for the workflow_trigger node that allows running one workflow from within another.
 * Exports the node definition, UI component, and executor.
 */

import definition from './definition';
import component from './ui';
import executor from './executor';

export {
  definition,
  component,
  executor
};