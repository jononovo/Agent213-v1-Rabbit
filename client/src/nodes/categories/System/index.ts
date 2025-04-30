/**
 * System Nodes
 * 
 * This module exports all system nodes.
 */

// Export the node types from this category
export const SYSTEM_NODE_TYPES = [
  'claude',
  'function_node',
  'send_to_webhook',
  // Additional nodes will be added as they are migrated
];

// Export node definitions for direct import
export { default as claude } from './claude/definition';
export { default as function_node } from './function_node/definition';
export { default as send_to_webhook } from './send_to_webhook/definition';