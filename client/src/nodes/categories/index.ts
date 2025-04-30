/**
 * Node Categories
 * 
 * This file exports all node categories and their respective nodes.
 * Categories are used to organize nodes in the node palette and in the node registry.
 */

// Export all node categories
export * from './System';
export * from './Custom';
export * from './Integration';
export * from './Agents';

// Export the list of all categories
export const NODE_CATEGORIES = [
  'System',
  'Custom',
  'Integration',
  'Agents'
];