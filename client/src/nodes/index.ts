/**
 * Node System Index
 * 
 * This file exports all node-related functionality as a single module.
 * It provides the public API for accessing nodes and node registry functions.
 * 
 * Note: This is the folder-based implementation that works alongside the unified node registry.
 */

import { NodeDefinition } from './types';
import fs from 'fs'; // Not actually used at runtime - just for types

/**
 * Dynamic folder-based node system
 * 
 * Instead of using a static registry, we now dynamically load nodes
 * from their folders. This makes the system more maintainable and
 * allows for easier addition of new nodes.
 */

// These functions provide a compatibility layer with the old registry
// but implement the functionality using the folder structure.

/**
 * Dynamically import a node definition at runtime
 * (This happens in the browser, not at build time)
 */
export async function importNodeDefinition(nodeType: string): Promise<NodeDefinition | null> {
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
 */
export async function getNode(nodeType: string): Promise<any> {
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
 * Get all available node types from the folder structure
 * Uses the same folder list that nodeSystem.ts uses for consistency
 */
export function getAllNodes(): any[] {
  // Import the same list of node types used by nodeSystem.ts
  // This ensures consistency across the application
  const FOLDER_BASED_NODE_TYPES = [
    'text_input',
    'claude',
    'http_request',
    'text_template',
    'data_transform',
    'decision',
    'function',
    'json_path',
    'text_formatter',
    'number_input',
    'toggle_switch'
  ];
  
  // Map the node types to their basic information
  // The detailed information will be loaded dynamically when needed
  return FOLDER_BASED_NODE_TYPES.map(type => {
    // Default values that will be overridden by definition when loaded
    let info: any = {
      type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `${type.replace(/_/g, ' ')} node`,
      category: getCategoryForNodeType(type),
      icon: getIconForNodeType(type)
    };
    
    return info;
  });
}

/**
 * Helper function to determine category based on node type
 */
function getCategoryForNodeType(type: string): string {
  // AI-related nodes
  if (['text_input', 'claude', 'text_template'].includes(type)) {
    return 'ai';
  }
  
  // Data processing nodes
  if (['data_transform', 'json_path', 'function', 'text_formatter'].includes(type)) {
    return 'data';
  }
  
  // Action/integration nodes, including former trigger nodes
  if (['http_request', 'decision', 'webhook_trigger', 'agent_trigger', 'embed_other_workflow'].includes(type)) {
    return 'actions';
  }
  
  // Input nodes
  if (['number_input', 'toggle_switch'].includes(type)) {
    return 'input';
  }
  
  // Default category
  return 'general';
}

/**
 * Helper function to determine icon based on node type
 */
function getIconForNodeType(type: string): string {
  const iconMap: Record<string, string> = {
    'text_input': 'type',
    'claude': 'sparkles',
    'http_request': 'globe',
    'text_template': 'file-text',
    'data_transform': 'repeat',
    'decision': 'git-branch',
    'function': 'code',
    'json_path': 'filter',
    'text_formatter': 'text',
    'number_input': 'hash',
    'toggle_switch': 'toggle-left'
  };
  
  return iconMap[type] || 'box';
}

/**
 * Get available node categories
 */
export function getNodeCategories(): string[] {
  // Get unique categories from all nodes
  const nodes = getAllNodes();
  const categories = nodes.map(node => node.category);
  
  // Use Array.filter instead of Set for compatibility
  const uniqueCategories: string[] = [];
  categories.forEach(category => {
    if (uniqueCategories.indexOf(category) === -1) {
      uniqueCategories.push(category);
    }
  });
  
  return uniqueCategories;
}

/**
 * Get nodes by category
 */
export function getNodesByCategory(category: string): any[] {
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