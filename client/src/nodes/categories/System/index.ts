/**
 * System Nodes
 * 
 * This module exports all system nodes.
 */

// Export the node types from this category
export const SYSTEM_NODE_TYPES = [
  'claude',
  // Additional nodes will be added as they are migrated
];

// Export claude node for direct import
export { default as claude } from './claude/definition';