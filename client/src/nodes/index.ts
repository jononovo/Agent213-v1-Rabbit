/**
 * Node System Index - Migration Adapter
 * 
 * This file now acts as a compatibility layer between the old folder-based system
 * and the new unified node registry.
 * 
 * IMPORTANT: This file is being phased out. All new code should use the unified node registry
 * directly from '@/lib/unifiedNodeRegistry'.
 */

import { NodeDefinition } from './types';
import { getAllNodes as getRegistryNodes, getNode as getRegistryNode } from '@/lib/unifiedNodeRegistry';

/**
 * IMPORTANT: This compatibility layer is deprecated and will be removed in a future version.
 * Use the unified node registry directly from '@/lib/unifiedNodeRegistry'.
 */

/**
 * Dynamically import a node definition at runtime
 * (This happens in the browser, not at build time)
 * 
 * @deprecated Use getNode from unifiedNodeRegistry instead
 */
export async function importNodeDefinition(nodeType: string): Promise<NodeDefinition | null> {
  console.warn('importNodeDefinition is deprecated. Use unifiedNodeRegistry.getNode instead.');
  try {
    // Dynamic import based on node type
    // Using @vite-ignore to suppress warnings about dynamic imports
    const module = await import(/* @vite-ignore */ `./${nodeType}/definition`);
    return module.default || module.nodeDefinition;
  } catch (error) {
    console.warn(`Failed to import node definition for type ${nodeType}:`, error);
    return null;
  }
}

/**
 * Get metadata for a specific node type
 * 
 * @deprecated Use getNode from unifiedNodeRegistry instead
 */
export async function getNode(nodeType: string): Promise<any> {
  console.warn('getNode from nodes/index.ts is deprecated. Use unifiedNodeRegistry.getNode instead.');
  // Attempt to get from unified registry first
  const registryNode = getRegistryNode(nodeType);
  if (registryNode) {
    return {
      type: registryNode.type,
      name: registryNode.name,
      description: registryNode.description,
      category: registryNode.category,
      icon: registryNode.icon,
    };
  }
  
  // Fallback to legacy import
  const definition = await importNodeDefinition(nodeType);
  if (!definition) return null;
  
  return {
    type: definition.type,
    name: definition.name,
    description: definition.description,
    category: definition.category,
    icon: definition.icon,
  };
}

/**
 * Get all available node types from the unified registry
 * 
 * @deprecated Use getAllNodes from unifiedNodeRegistry instead
 */
export function getAllNodes(): any[] {
  console.warn('getAllNodes from nodes/index.ts is deprecated. Use unifiedNodeRegistry.getAllNodes instead.');
  // Now gets nodes directly from the unified registry
  return getRegistryNodes().map(node => ({
    type: node.type,
    name: node.name,
    description: node.description,
    category: node.category,
    icon: node.icon
  }));
}

/**
 * Get available node categories
 * 
 * @deprecated Use the unified node registry directly
 */
export function getNodeCategories(): string[] {
  console.warn('getNodeCategories from nodes/index.ts is deprecated. Use the unified registry instead.');
  // Get unique categories from all nodes
  const nodes = getAllNodes();
  const categories = nodes.map(node => node.category);
  
  // Use Array.filter instead of Set for compatibility
  const uniqueCategories: string[] = [];
  categories.forEach(category => {
    if (category && uniqueCategories.indexOf(category) === -1) {
      uniqueCategories.push(category);
    }
  });
  
  return uniqueCategories;
}

/**
 * Get nodes by category
 * 
 * @deprecated Use the unified registry directly
 */
export function getNodesByCategory(category: string): any[] {
  console.warn('getNodesByCategory from nodes/index.ts is deprecated. Use the unified registry instead.');
  const nodes = getAllNodes();
  return nodes.filter(node => node.category === category);
}

// Default export is a compatibility object with the main functions
export default {
  getNode,
  getAllNodes,
  getNodeCategories,
  getNodesByCategory
};