/**
 * Node Discovery
 * 
 * This module handles the discovery of node definitions from the filesystem.
 * It provides utilities for scanning node directories and locating node files.
 */

import { NodeDefinition } from '../types/nodeDefinitions';
// Forward declaration to avoid circular dependency
export type RegisterNodeDefinitionFn = (definition: NodeDefinition, folderPath: string) => boolean;
let registerNodeDefinitionFn: RegisterNodeDefinitionFn | null = null;

// Set the registration function from registry
export function setRegisterNodeDefinitionFn(fn: RegisterNodeDefinitionFn) {
  registerNodeDefinitionFn = fn;
}

// Define all supported node folder locations - single source of truth
export const NODE_FOLDERS = ['System', 'Custom', 'Integration', 'Agents'];

/**
 * Process node definitions for a specific folder
 */
export function processDefinitions(folder: string, definitionModules: Record<string, any>): number {
  let count = 0;
  
  for (const path in definitionModules) {
    const module = definitionModules[path] as any;
    const nodeDef = module.default as NodeDefinition;
    
    if (registerNodeDefinitionFn && registerNodeDefinitionFn(nodeDef, folder)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Discover all node definitions from defined folders
 */
export async function discoverNodeDefinitions(): Promise<void> {
  try {
    console.log('Discovering node definitions...');
    let count = 0;
    
    // Use static patterns for import.meta.glob (it doesn't support dynamic templates)
    const systemDefinitions = import.meta.glob('../../categories/System/*/definition.ts', { eager: true });
    const customDefinitions = import.meta.glob('../../categories/Custom/*/definition.ts', { eager: true });
    const integrationDefinitions = import.meta.glob('../../categories/Integration/*/definition.ts', { eager: true });
    const agentsDefinitions = import.meta.glob('../../categories/Agents/*/definition.ts', { eager: true });
    
    // Process each folder with its corresponding definitions
    count += processDefinitions('System', systemDefinitions);
    count += processDefinitions('Custom', customDefinitions);
    count += processDefinitions('Integration', integrationDefinitions);
    count += processDefinitions('Agents', agentsDefinitions);
    
    console.log(`Discovered ${count} node definitions`);
  } catch (error) {
    console.error('Error discovering node definitions:', error);
  }
}

/**
 * Get path to node executor file
 */
export function getNodeExecutorPath(nodeType: string, folderPath: string): string {
  return `../../categories/${folderPath}/${nodeType}/executor`;
}

/**
 * Get path to node definition file
 */
export function getNodeDefinitionPath(nodeType: string, folderPath: string): string {
  return `../../categories/${folderPath}/${nodeType}/definition`;
}

/**
 * Get path to node UI component file
 */
export function getNodeUIPath(nodeType: string, folderPath: string): string {
  return `../../categories/${folderPath}/${nodeType}/ui`;
}

export default {
  NODE_FOLDERS,
  discoverNodeDefinitions,
  processDefinitions,
  getNodeExecutorPath,
  getNodeDefinitionPath,
  getNodeUIPath
};