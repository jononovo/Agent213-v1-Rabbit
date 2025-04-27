/**
 * Default Node Implementation - DEPRECATED
 * 
 * ⚠️ DEPRECATED: This node has been renamed to "BaseNode" and moved to the "Base" folder.
 * Please use BaseNode instead as this Default implementation will be removed in the future.
 * 
 * This is the default node implementation that serves as a
 * fallback for node types without specific implementations.
 */

// Log deprecation warning
console.warn("The Default node implementation is deprecated. Please use BaseNode from the Base folder instead.");

import DefaultNode from './ui';

// Re-export BaseNode as a drop-in replacement for DefaultNode
import { BaseNode } from '../Base';

// Export both for backward compatibility, but prefer BaseNode
export { DefaultNode, BaseNode };

// Default export is now BaseNode instead of DefaultNode for new code
export default BaseNode;