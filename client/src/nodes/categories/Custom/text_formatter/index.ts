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

// Named exports for static imports - MUST use this exact pattern for registration
export { definition, execute };

// Export the UI component - this is critical for component registration
export { TextFormatterNode as component };

// Default export for dynamic imports
export default { definition, execute, component: TextFormatterNode };