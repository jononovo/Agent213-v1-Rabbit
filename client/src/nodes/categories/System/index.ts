/**
 * System Nodes
 * 
 * This module exports all system nodes.
 */

// Export the node types from this category
export const SYSTEM_NODE_TYPES = [
  'claude',
  'function_node',
  // Additional nodes will be added as they are migrated
];

// Export node definitions for direct import
export { default as claude } from './claude/definition';
export { default as function_node } from './function_node/definition';