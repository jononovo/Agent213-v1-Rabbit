/**
 * Text Formatter Node Exports
 * 
 * This file exports all components of the Text Formatter node
 * for discovery and registration by the node system.
 */

// Import all components
import definition from './definition';
import { execute } from './executor';
import TextFormatterNode from './ui';

// Named exports for static imports
export { definition, execute };
export const component = TextFormatterNode;

// Default export for dynamic imports
export default { definition, execute, component };