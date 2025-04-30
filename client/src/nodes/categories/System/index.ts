/**
 * System Nodes
 * 
 * This module exports all system nodes that provide core
 * functionality for the workflow engine.
 */

// Import the node definitions
import sendToWebhookDefinition from './send_to_webhook/definition';

// Export the node types from this category
export const SYSTEM_NODE_TYPES: string[] = [
  'send_to_webhook',
  // Other system nodes will be added as they are migrated
];

// Export the node definitions
export { default as send_to_webhook } from './send_to_webhook/definition';

// Export the node executors
export { execute as execute_send_to_webhook } from './send_to_webhook/executor';