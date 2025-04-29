/**
 * Base Node Template Entry Point
 * 
 * This file exports all components needed by the node registry.
 * It allows for dynamic imports and automatic node registration.
 */

import { definition } from './definition';
import { executor } from './executor';

// Export all components for node registration
export {
  definition,
  executor
};

// Export ui component (loaded dynamically)
export { component } from './ui';