/**
 * Unified Node Registry - Single Source of Truth
 * 
 * This module provides a centralized registry for all nodes in the system.
 * It handles discovery, registration, validation, and executor management
 * to ensure consistency across the entire application.
 */

import { NodeDefinition, PortDefinition } from '../nodes/types';
import { EnhancedNodeExecutor, NodeExecutionData } from './types/workflow';

// Registry data structures
interface RegisteredNode {
  // Core node info
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  folderPath: string; // 'System' or 'Custom'
  
  // Components
  definition: NodeDefinition;
  executor?: EnhancedNodeExecutor;
  uiComponent?: any;
  defaultData?: Record<string, any>;
  
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

// Required fields for validation
const REQUIRED_NODE_FIELDS = [
  'type',
  'name',
  'description',
  'category',
  'version',
  'inputs',
  'outputs'
];

const REQUIRED_PORT_FIELDS = [
  'type',
  'description'
];

/**
 * Initialize the registry by discovering all nodes
 */
export async function initializeRegistry(): Promise<void> {
  if (discoveryComplete) return;
  
  console.log('🔄 Initializing Unified Node Registry...');
  
  try {
    // Discover all node definitions from the filesystem
    await discoverNodeDefinitions();
    
    // Load executors for all discovered nodes
    await loadNodeExecutors();
    
    // Generate report on registry state
    generateRegistryReport();
    
    discoveryComplete = true;
    console.log(`✅ Unified Node Registry initialized with ${nodeRegistry.size} nodes`);
  } catch (error) {
    console.error('❌ Error initializing Unified Node Registry:', error);
  }
}

/**
 * Discover all node definitions from both System and Custom folders
 */
async function discoverNodeDefinitions(): Promise<void> {
  try {
    console.log('Discovering node definitions...');
    
    // Import all definition files using Vite's import.meta.glob
    const systemDefinitionModules = import.meta.glob('../nodes/System/*/definition.ts', { eager: true });
    const customDefinitionModules = import.meta.glob('../nodes/Custom/*/definition.ts', { eager: true });
    
    // Process system nodes
    let count = 0;
    for (const path in systemDefinitionModules) {
      const module = systemDefinitionModules[path] as any;
      const nodeDef = module.default as NodeDefinition;
      
      if (registerNodeDefinition(nodeDef, 'System')) {
        count++;
      }
    }
    
    // Process custom nodes
    for (const path in customDefinitionModules) {
      const module = customDefinitionModules[path] as any;
      const nodeDef = module.default as NodeDefinition;
      
      if (registerNodeDefinition(nodeDef, 'Custom')) {
        count++;
      }
    }
    
    console.log(`Discovered ${count} node definitions`);
  } catch (error) {
    console.error('Error discovering node definitions:', error);
  }
}

/**
 * Register a node definition in the registry
 */
function registerNodeDefinition(definition: NodeDefinition, folderPath: string): boolean {
  if (!definition || !definition.type) {
    console.warn('Attempted to register invalid node definition:', definition);
    return false;
  }
  
  const nodeType = definition.type;
  
  // Validate the node definition
  const validation = validateNodeDefinition(definition);
  
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
      
      isValid: validation.isValid,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      
      isFullyRegistered: false,
      missingComponents: ['executor', 'uiComponent']
    });
    
    console.log(`Registered node definition: ${nodeType} (${folderPath})`);
    return true;
  } else {
    // Update existing entry with new definition
    const node = nodeRegistry.get(nodeType)!;
    node.definition = definition;
    node.isValid = validation.isValid;
    node.validationErrors = validation.errors;
    node.validationWarnings = validation.warnings;
    
    // Check if defaultData is now available
    if (definition.defaultData && !node.defaultData) {
      node.defaultData = definition.defaultData;
    }
    
    console.log(`Updated existing node definition: ${nodeType}`);
    return false;
  }
}

/**
 * Validate a node definition
 */
function validateNodeDefinition(definition: NodeDefinition): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  for (const field of REQUIRED_NODE_FIELDS) {
    if (definition[field as keyof NodeDefinition] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check for defaultData (warn rather than error)
  if (!definition.defaultData) {
    warnings.push('Missing defaultData');
  }
  
  // Validate semantic versioning format
  if (definition.version && !/^\d+\.\d+\.\d+$/.test(definition.version)) {
    warnings.push(`Version should follow semantic versioning (e.g., 1.0.0), got: ${definition.version}`);
  }
  
  // Validate inputs
  if (definition.inputs) {
    validatePorts('input', definition.inputs, errors, warnings);
  }
  
  // Validate outputs
  if (definition.outputs) {
    validatePorts('output', definition.outputs, errors, warnings);
  }
  
  // Check if icon is provided
  if (!definition.icon) {
    warnings.push('No icon specified for node');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate port definitions
 */
function validatePorts(
  portType: 'input' | 'output',
  ports: Record<string, PortDefinition>,
  errors: string[],
  warnings: string[]
): void {
  const portNames = Object.keys(ports);
  
  // Outputs should have at least one port
  if (portNames.length === 0 && portType === 'output') {
    warnings.push(`Node has no ${portType} ports defined`);
  }
  
  // Validate each port
  for (const portName of portNames) {
    const port = ports[portName];
    
    // Check required port fields
    for (const field of REQUIRED_PORT_FIELDS) {
      if (port[field as keyof PortDefinition] === undefined) {
        errors.push(`Missing required field '${field}' for ${portType} port: ${portName}`);
      }
    }
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
    const executorPath = `../nodes/${node.folderPath}/${nodeType}/executor`;
    
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
  console.group('📊 Unified Node Registry Report');
  
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
  
  console.groupEnd();
}

// PUBLIC API

/**
 * Get information about all registered nodes
 */
export function getAllNodes(): RegisteredNode[] {
  return Array.from(nodeRegistry.values());
}

/**
 * Get node by type
 */
export function getNode(nodeType: string): RegisteredNode | undefined {
  return nodeRegistry.get(nodeType);
}

/**
 * Check if a node type exists
 */
export function hasNode(nodeType: string): boolean {
  return nodeRegistry.has(nodeType);
}

/**
 * Get a node's executor
 */
export function getNodeExecutor(nodeType: string): EnhancedNodeExecutor | undefined {
  const node = nodeRegistry.get(nodeType);
  return node?.executor;
}

/**
 * Get a node's settings configuration
 */
export function getNodeSettings(nodeType: string): any[] {
  const node = nodeRegistry.get(nodeType);
  return node?.definition.settings || [];
}

/**
 * Get all node types (for backward compatibility)
 */
export function getAllNodeTypes(): string[] {
  return Array.from(nodeRegistry.keys());
}

/**
 * Get all node types by category (System or Custom)
 */
export function getNodeTypesByCategory(category: 'System' | 'Custom'): string[] {
  return Array.from(nodeRegistry.values())
    .filter(node => node.folderPath === category)
    .map(node => node.type);
}

/**
 * Get all System node types (for backward compatibility)
 */
export function getSystemNodeTypes(): string[] {
  return getNodeTypesByCategory('System');
}

/**
 * Get all Custom node types (for backward compatibility)
 */
export function getCustomNodeTypes(): string[] {
  return getNodeTypesByCategory('Custom');
}

/**
 * Get path to node executor file
 */
export function getNodeExecutorPath(nodeType: string): string {
  const node = nodeRegistry.get(nodeType);
  if (!node) return `../nodes/System/${nodeType}/executor`;
  return `../nodes/${node.folderPath}/${nodeType}/executor`;
}

/**
 * Get path to node definition file
 */
export function getNodeDefinitionPath(nodeType: string): string {
  const node = nodeRegistry.get(nodeType);
  if (!node) return `../nodes/System/${nodeType}/definition`;
  return `../nodes/${node.folderPath}/${nodeType}/definition`;
}

/**
 * Get path to node UI component file
 */
export function getNodeUIPath(nodeType: string): string {
  const node = nodeRegistry.get(nodeType);
  if (!node) return `../nodes/System/${nodeType}/ui`;
  return `../nodes/${node.folderPath}/${nodeType}/ui`;
}

// Note: The registry is no longer initialized automatically on module import
// It must be explicitly initialized by calling initializeRegistry() when needed