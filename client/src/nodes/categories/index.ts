/**
 * Node Categories Export
 * 
 * This file exports all node categories and their node types,
 * providing a single entry point for accessing all available nodes.
 */

// Export all node categories
export * from './System';
export * from './Agents';
export * from './Custom';
export * from './Integration';

// Export consolidated node type list for registration
import { SYSTEM_NODE_TYPES } from './System';
import { AGENTS_NODE_TYPES } from './Agents';
import { CUSTOM_NODE_TYPES } from './Custom';
import { INTEGRATION_NODE_TYPES } from './Integration';

// Combine all node types into a single array for registration
export const ALL_NODE_TYPES = [
  ...SYSTEM_NODE_TYPES,
  ...AGENTS_NODE_TYPES,
  ...CUSTOM_NODE_TYPES,
  ...INTEGRATION_NODE_TYPES
];