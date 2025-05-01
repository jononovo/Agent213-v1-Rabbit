/**
 * Custom Nodes
 * 
 * This module exports all custom nodes that are specific to
 * the application's unique requirements.
 */

// Import the node definitions and components
import textFormatterDefinition from './text_formatter/definition';
import { component as TextFormatterComponent } from './text_formatter';

// Export the node types from this category
export const CUSTOM_NODE_TYPES: string[] = [
  'text_formatter'
];

// Export the node definitions
export { default as text_formatter } from './text_formatter/definition';

// Export the node executors
export { execute as execute_text_formatter } from './text_formatter/executor';

// Export the node UI components
export { TextFormatterComponent as ui_component_text_formatter };