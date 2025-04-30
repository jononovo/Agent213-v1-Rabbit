/**
 * Node System Main Export
 * 
 * This file serves as the main entry point for the node system,
 * exporting core functionality and all node categories.
 */

// Export core functionality
export * from './core';

// Export all node categories
export * from './categories';

// Re-export common types for convenience
export type {
  NodeDefinition,
  PortDefinition
} from './core/types/nodeDefinitions';

export type {
  NodeExecutionData,
  WorkflowItem,
  EnhancedNodeExecutor
} from './core/types/nodeExecutionTypes';

// Export the BaseNode component directly for easy access
export { BaseNode } from './core/base';

// Export the NODE_REGISTRY from the registry module
export { NODE_REGISTRY } from './core/registry/nodeRegistry';