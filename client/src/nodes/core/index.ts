/**
 * Core Node System
 * 
 * This is the main entry point for the core node system.
 * It exports all the important interfaces, types, and functions
 * that are needed by the rest of the application.
 */

// Export registry functions and utilities
export { 
  initializeRegistry,
  loadNodeComponent,
  registerNodeDefinition,
  loadNodeExecutors,
  getNode,
  getAllNodes,
  getNodesByCategory,
  getNodeCapabilities,
  isIntegrationNode,
  IntegrationCapabilities,
  RegisteredNode
} from './registry/nodeRegistry';

export {
  NODE_FOLDERS,
  discoverNodeDefinitions,
  processDefinitions,
  getNodeExecutorPath,
  getNodeDefinitionPath,
  getNodeUIPath,
  setRegisterNodeDefinitionFn
} from './registry/nodeDiscovery';

export {
  formatPortDefinitions,
  validateNodeDefinition,
  validatePorts
} from './registry/nodeValidation';

// Export types from dedicated type modules only
export {
  NodeDefinition,
  PortDefinition,
  NodeSettings,
  NodeSettingsField
} from './types/nodeDefinitions';

export {
  NodeExecutionData,
  WorkflowItem,
  EnhancedNodeExecutor,
  createWorkflowItem
} from './types/nodeExecutionTypes';

// Initialize function that sets up the entire node system
export async function initializeNodeSystem(): Promise<void> {
  const { initializeRegistry } = await import('./registry/nodeRegistry');
  await initializeRegistry();
}