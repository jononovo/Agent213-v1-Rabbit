/**
 * Node Registry - Primary Registry Module
 * 
 * This module provides the core registry functionality for nodes in the system.
 * It manages the node registry and provides access to registered nodes.
 */

import { NodeDefinition } from '../types/nodeDefinitions';
import { EnhancedNodeExecutor, NodeExecutionData } from '@/lib/types/workflow';
import { discoverNodeDefinitions } from './nodeDiscovery';
import { validateNodeDefinition, validatePorts } from './nodeValidation';

// Integration node capabilities
export interface IntegrationCapabilities {
  // What the node offers to the system
  provides?: {
    endpoint?: boolean;    // This node provides an HTTP endpoint
    webhook?: boolean;     // This node acts as a webhook receiver
    scheduler?: boolean;   // This node provides scheduling capabilities
  };
  
  // What the node needs from the system
  requires?: {
    storage?: boolean;       // Needs persistent storage for configuration
    authentication?: boolean; // Requires authentication
  };
  
  // Endpoint configuration (applicable when provides.endpoint=true)
  endpoint?: {
    pathTemplate?: string;   // URL path template
    methods?: string[];      // Supported HTTP methods
    authTypes?: string[];    // Supported auth methods
  };
}

// Registry data structures
export interface RegisteredNode {
  // Core node info
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  folderPath: string; // 'System', 'Custom', or 'Integration'
  
  // Components
  definition: NodeDefinition;
  executor?: EnhancedNodeExecutor;
  uiComponent?: any;
  defaultData?: Record<string, any>;
  
  // Integration capabilities (only for integration nodes)
  isIntegrationNode?: boolean;
  integrationCapabilities?: IntegrationCapabilities;
  
  // Validation state
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  
  // Registration status
  isFullyRegistered: boolean;
  missingComponents: string[];
}

// Registry storage
const nodeRegistry: Map<string, RegisteredNode> = new Map();
let discoveryComplete = false;

/**
 * Initialize the registry by discovering all nodes
 */
export async function initializeRegistry(): Promise<void> {
  if (discoveryComplete) return;
  
  console.log('🔄 Initializing Node Registry...');
  
  try {
    // Discover all node definitions from the filesystem
    await discoverNodeDefinitions(nodeRegistry);
    
    // Load executors for all discovered nodes
    await loadNodeExecutors();
    
    // Generate report on registry state
    generateRegistryReport();
    
    discoveryComplete = true;
    console.log(`✅ Node Registry initialized with ${nodeRegistry.size} nodes`);
  } catch (error) {
    console.error('❌ Error initializing Node Registry:', error);
  }
}

/**
 * Load a node component by type
 */
export async function loadNodeComponent(nodeType: string): Promise<any> {
  // Get the folder from the registry
  const node = nodeRegistry.get(nodeType);
  
  if (!node) {
    console.warn(`Node ${nodeType} not found in registry, using BaseNode`);
    const { BaseNode } = await import('../base');
    return BaseNode;
  }
  
  try {
    // Load UI component directly from ui.tsx using the folder from registry
    const uiModule = await import(/* @vite-ignore */ `../categories/${node.folderPath}/${nodeType}/ui`);
    return uiModule.default;
  } catch (error) {
    console.warn(`Failed to load UI for ${nodeType}, using BaseNode`);
    const { BaseNode } = await import('../base');
    return BaseNode;
  }
}

/**
 * Register a node definition in the registry
 */
export function registerNodeDefinition(definition: NodeDefinition, folderPath: string): boolean {
  if (!definition || !definition.type) {
    console.warn('Attempted to register invalid node definition:', definition);
    return false;
  }
  
  const nodeType = definition.type;
  
  // Validate the node definition
  const validation = validateNodeDefinition(definition);
  
  // Determine if this is an integration node based on folder path
  const isIntegrationNode = folderPath === 'Integration';
  
  // Extract integration capabilities if available
  const integrationCapabilities = isIntegrationNode 
    ? (definition as any).integrationConfig as IntegrationCapabilities
    : undefined;
    
  // Create registry entry if it doesn't exist
  if (!nodeRegistry.has(nodeType)) {
    nodeRegistry.set(nodeType, {
      type: nodeType,
      name: definition.name || nodeType,
      description: definition.description || '',
      category: definition.category || 'general',
      icon: definition.icon || 'bolt',
      version: definition.version || '1.0.0',
      folderPath,
      
      definition,
      executor: undefined,
      uiComponent: undefined,
      defaultData: definition.defaultData,
      
      // Integration-specific properties
      isIntegrationNode,
      integrationCapabilities,
      
      isValid: validation.isValid,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      
      isFullyRegistered: false,
      missingComponents: ['executor', 'uiComponent']
    });
    
    // Log registration with integration info if applicable
    if (isIntegrationNode) {
      console.log(`Registered integration node: ${nodeType} (${folderPath})`);
      if (integrationCapabilities) {
        console.log(`Integration capabilities for ${nodeType}:`, integrationCapabilities);
      } else {
        console.warn(`Integration node ${nodeType} does not define integrationConfig`);
      }
    } else {
      console.log(`Registered node definition: ${nodeType} (${folderPath})`);
    }
    
    return true;
  } else {
    // Update existing entry with new definition
    const node = nodeRegistry.get(nodeType)!;
    node.definition = definition;
    node.isValid = validation.isValid;
    node.validationErrors = validation.errors;
    node.validationWarnings = validation.warnings;
    
    // Update integration properties if applicable
    if (isIntegrationNode) {
      node.isIntegrationNode = true;
      node.integrationCapabilities = integrationCapabilities;
      
      if (integrationCapabilities) {
        console.log(`Updated integration capabilities for ${nodeType}`);
      } else {
        console.warn(`Integration node ${nodeType} does not define integrationConfig`);
      }
    }
    
    // Check if defaultData is now available
    if (definition.defaultData && !node.defaultData) {
      node.defaultData = definition.defaultData;
    }
    
    console.log(`Updated existing node definition: ${nodeType}`);
    return false;
  }
}

/**
 * Load executors for all registered nodes
 */
async function loadNodeExecutors(): Promise<void> {
  console.log('Loading node executors...');
  
  const nodeTypes = Array.from(nodeRegistry.keys());
  let loadedCount = 0;
  
  for (const nodeType of nodeTypes) {
    const node = nodeRegistry.get(nodeType)!;
    const executorPath = `../categories/${node.folderPath}/${nodeType}/executor`;
    
    try {
      // Dynamically import the executor
      const executorModule = await import(/* @vite-ignore */ executorPath);
      
      if (!executorModule || !executorModule.execute) {
        console.warn(`Invalid executor for node type ${nodeType}: Missing execute function`);
        continue;
      }
      
      // Create and register the enhanced executor
      const enhancedExecutor = createEnhancedExecutor(node, executorModule);
      
      // Update the registry entry
      node.executor = enhancedExecutor;
      node.missingComponents = node.missingComponents.filter(c => c !== 'executor');
      node.isFullyRegistered = node.missingComponents.length === 0;
      
      loadedCount++;
      console.log(`Loaded executor for node type: ${nodeType}`);
    } catch (error) {
      console.error(`Error loading executor for node type ${nodeType}:`, error);
    }
  }
  
  console.log(`Loaded ${loadedCount} node executors`);
}

/**
 * Create an enhanced executor for a node
 */
function createEnhancedExecutor(
  node: RegisteredNode,
  executorModule: any
): EnhancedNodeExecutor {
  // Create the executor definition
  const executorDefinition = {
    type: node.type,
    displayName: node.name,
    description: node.description,
    icon: node.icon,
    category: node.category,
    version: node.version,
    inputs: formatPortDefinitions(node.definition.inputs || {}, true),
    outputs: formatPortDefinitions(node.definition.outputs || {}, false)
  };
  
  // Create the executor function
  const executorFunction = async (
    nodeData: Record<string, any>,
    inputs: Record<string, NodeExecutionData>
  ): Promise<NodeExecutionData> => {
    try {
      // Execute the node
      const result = await executorModule.execute(nodeData, inputs);
      
      // Format the result based on the shape returned by the executor
      if (typeof result === 'object' && result !== null) {
        // If the executor returns a properly formatted NodeExecutionData object, use it directly
        if (result.items && result.meta) {
          return result;
        }
        
        // If the executor returns multiple outputs as a record, format each one
        if (Object.keys(result).some(key => node.definition.outputs && node.definition.outputs[key])) {
          // Multiple outputs case - return as is, assuming executor handles proper formatting
          return result;
        }
      }
      
      // Default case: wrap the result in a standard format
      return {
        items: Array.isArray(result) 
          ? result.map(item => ({ json: item }))
          : [{ json: result }],
        meta: { startTime: new Date(), endTime: new Date() }
      };
    } catch (error) {
      console.error(`Error executing ${node.type} node:`, error);
      return {
        items: [{
          json: { error: error instanceof Error ? error.message : String(error) }
        }],
        meta: { startTime: new Date(), endTime: new Date(), error: true }
      };
    }
  };
  
  // Return the enhanced executor
  return {
    definition: executorDefinition,
    execute: executorFunction
  };
}

/**
 * Format port definitions for the workflow engine
 */
function formatPortDefinitions(ports: Record<string, any>, isInput: boolean): Record<string, any> {
  return Object.fromEntries(
    Object.entries(ports).map(([key, value]: [string, any]) => [
      key,
      {
        type: value.type || 'string',
        displayName: key,
        description: value.description || '',
        ...(isInput ? { required: value.optional ? !value.optional : true } : {})
      }
    ])
  );
}

/**
 * Generate a report on the registry state
 */
function generateRegistryReport(): void {
  console.group('📊 Node Registry Report');
  
  const nodeCount = nodeRegistry.size;
  const validNodes = Array.from(nodeRegistry.values()).filter(n => n.isValid);
  const fullyRegisteredNodes = Array.from(nodeRegistry.values()).filter(n => n.isFullyRegistered);
  
  console.log(`Total Nodes: ${nodeCount}`);
  console.log(`Valid Nodes: ${validNodes.length}`);
  console.log(`Fully Registered Nodes: ${fullyRegisteredNodes.length}`);
  
  // Report on nodes with validation errors
  const nodesWithErrors = Array.from(nodeRegistry.values()).filter(n => n.validationErrors.length > 0);
  if (nodesWithErrors.length > 0) {
    console.warn(`⚠️ ${nodesWithErrors.length} nodes have validation errors:`);
    nodesWithErrors.forEach(node => {
      console.warn(`  - ${node.type}: ${node.validationErrors.join(', ')}`);
    });
  }
  
  // Report on nodes missing components
  const nodesWithMissingComponents = Array.from(nodeRegistry.values())
    .filter(n => n.missingComponents.length > 0);
  
  if (nodesWithMissingComponents.length > 0) {
    console.warn(`⚠️ ${nodesWithMissingComponents.length} nodes are missing components:`);
    nodesWithMissingComponents.forEach(node => {
      console.warn(`  - ${node.type}: Missing ${node.missingComponents.join(', ')}`);
    });
  }
  
  // Report on integration nodes
  const integrationNodes = Array.from(nodeRegistry.values()).filter(n => n.isIntegrationNode);
  if (integrationNodes.length > 0) {
    console.log(`🔌 ${integrationNodes.length} integration nodes registered`);
  }
  
  console.groupEnd();
}

// Registry lookup functions
export function getAllNodes(): RegisteredNode[] {
  return Array.from(nodeRegistry.values());
}

export function getNode(nodeType: string): RegisteredNode | undefined {
  return nodeRegistry.get(nodeType);
}

export function getNodesByCategory(category: string): RegisteredNode[] {
  return Array.from(nodeRegistry.values())
    .filter(node => node.category === category);
}

export function getNodeExecutor(nodeType: string): EnhancedNodeExecutor | undefined {
  return nodeRegistry.get(nodeType)?.executor;
}

export function isNodeOfType(nodeType: string, category: string): boolean {
  const node = nodeRegistry.get(nodeType);
  return node ? node.category === category : false;
}

export function isIntegrationNode(nodeType: string): boolean {
  const node = nodeRegistry.get(nodeType);
  return node ? !!node.isIntegrationNode : false;
}

// Define all supported node folder locations - single source of truth
export const NODE_FOLDERS = ['System', 'Custom', 'Integration', 'Agents'];