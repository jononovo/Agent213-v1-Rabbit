/**
 * Processing Node Template Implementation
 * 
 * This file exports the necessary components and settings for the processing node.
 * It serves as the entry point for the node in the workflow editor.
 */

import ProcessingNodeComponent from './ui';
import definition from './definition';

// Export the component for use in the workflow editor
export const component = ProcessingNodeComponent;

// Export the definition
export { definition };

// Default export for simpler imports
export default ProcessingNodeComponent;