/**
 * Node Registry - Single Source of Truth for Node Discovery
 * 
 * This module provides a centralized registry for all nodes in the system.
 * It discovers nodes dynamically from the filesystem and provides access
 * to their metadata, avoiding the need for manual registration in multiple places.
 */

import { NodeDefinition } from '../nodes/types';

// Interface for node metadata
export interface NodeTypeInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  folderPath: string; // System or Custom
  settings?: any[]; // Settings configuration from node definition
}

// Storage for discovered nodes
let discoveredNodes: Map<string, NodeTypeInfo> = new Map();
let nodeDiscoveryComplete = false;

/**
 * Initialize the node registry by discovering all available nodes
 */
export async function initNodeRegistry(): Promise<void> {
  if (nodeDiscoveryComplete) return;
  
  try {
    // Discover system nodes
    const systemDefinitionModules = import.meta.glob('../nodes/System/*/definition.ts', { eager: true });
    await processNodeDefinitions(systemDefinitionModules, 'System');
    
    // Discover custom nodes
    const customDefinitionModules = import.meta.glob('../nodes/Custom/*/definition.ts', { eager: true });
    await processNodeDefinitions(customDefinitionModules, 'Custom');
    
    // Legacy node discovery (root folder)
    const rootDefinitionModules = import.meta.glob('../nodes/*/definition.ts', { eager: true });
    await processNodeDefinitions(rootDefinitionModules, 'Root');
    
    nodeDiscoveryComplete = true;
    console.log(`Node Registry initialized with ${discoveredNodes.size} nodes`);
  } catch (error) {
    console.error('Error initializing node registry:', error);
  }
}

/**
 * Process definition modules and register nodes
 */
async function processNodeDefinitions(modules: Record<string, any>, folderPath: string): Promise<void> {
  for (const path in modules) {
    try {
      const module = modules[path];
      const definition = module.default;
      
      if (!definition || !definition.type) {
        console.warn(`Skipping invalid node definition at ${path}`);
        continue;
      }
      
      // Register the node
      discoveredNodes.set(definition.type, {
        id: definition.type,
        name: definition.name || definition.displayName || definition.type,
        description: definition.description || '',
        category: definition.category || 'custom',
        icon: definition.icon || null,
        folderPath,
        settings: definition.settings || []
      });
    } catch (error) {
      console.error(`Error processing node definition at ${path}:`, error);
    }
  }
}

/**
 * Get all discovered node types
 */
export function getAllNodeTypes(): NodeTypeInfo[] {
  return Array.from(discoveredNodes.values());
}

/**
 * Get node info by type
 */
export function getNodeInfo(nodeType: string): NodeTypeInfo | undefined {
  return discoveredNodes.get(nodeType);
}

/**
 * Check if a node type exists
 */
export function hasNodeType(nodeType: string): boolean {
  return discoveredNodes.has(nodeType);
}

/**
 * Get path to node UI component
 */
export function getNodeUIPath(nodeType: string): string {
  const info = discoveredNodes.get(nodeType);
  if (!info) return '';
  
  return `../nodes/${info.folderPath}/${nodeType}/ui`;
}

/**
 * Get path to node executor
 */
export function getNodeExecutorPath(nodeType: string): string {
  const info = discoveredNodes.get(nodeType);
  if (!info) return '';
  
  return `../nodes/${info.folderPath}/${nodeType}/executor`;
}

/**
 * Get path to node definition
 */
export function getNodeDefinitionPath(nodeType: string): string {
  const info = discoveredNodes.get(nodeType);
  if (!info) return '';
  
  return `../nodes/${info.folderPath}/${nodeType}/definition`;
}

/**
 * Get settings for a specific node type
 * This provides the configuration for the NodeSettingsDrawer
 */
export function getNodeSettings(nodeType: string): any[] {
  const info = discoveredNodes.get(nodeType);
  if (!info || !info.settings) return [];
  
  return info.settings;
}

// Note: The registry is no longer initialized automatically on module import
// It must be explicitly initialized by calling initNodeRegistry() when needed