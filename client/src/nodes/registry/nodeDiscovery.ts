/**
 * Node Discovery Module
 * 
 * This module handles the discovery of node definitions from the filesystem.
 * It scans for node definitions in the categories directory and registers them with the registry.
 */

import { NodeDefinition } from '../types/nodeDefinitions';
import { RegisteredNode, registerNodeDefinition, NODE_FOLDERS } from './nodeRegistry';

/**
 * Process node definitions for a specific folder
 */
function processDefinitions(
  nodeRegistry: Map<string, RegisteredNode>,
  folder: string, 
  definitionModules: Record<string, any>
): number {
  let count = 0;
  
  for (const path in definitionModules) {
    const module = definitionModules[path] as any;
    const nodeDef = module.default as NodeDefinition;
    
    if (registerNodeDefinition(nodeDef, folder)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Discover all node definitions from defined folders
 */
export async function discoverNodeDefinitions(
  nodeRegistry: Map<string, RegisteredNode>
): Promise<void> {
  try {
    console.log('Discovering node definitions...');
    let count = 0;
    
    // Use static patterns for import.meta.glob (it doesn't support dynamic templates)
    const systemDefinitions = import.meta.glob('../categories/System/*/definition.ts', { eager: true });
    const customDefinitions = import.meta.glob('../categories/Custom/*/definition.ts', { eager: true });
    const integrationDefinitions = import.meta.glob('../categories/Integration/*/definition.ts', { eager: true });
    const agentsDefinitions = import.meta.glob('../categories/Agents/*/definition.ts', { eager: true });
    
    // Process each folder with its corresponding definitions
    count += processDefinitions(nodeRegistry, 'System', systemDefinitions);
    count += processDefinitions(nodeRegistry, 'Custom', customDefinitions);
    count += processDefinitions(nodeRegistry, 'Integration', integrationDefinitions);
    count += processDefinitions(nodeRegistry, 'Agents', agentsDefinitions);
    
    console.log(`Discovered ${count} node definitions`);
  } catch (error) {
    console.error('Error discovering node definitions:', error);
  }
}