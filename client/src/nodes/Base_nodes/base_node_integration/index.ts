/**
 * Base Integration Node Index
 * 
 * This file exports all components of the integration node.
 * It's the entry point for node registration.
 */

import { definition } from './definition';
import { execute } from './executor';
import { component, validator } from './ui';
import tests from './tests';

// Export individual components
export { 
  definition,
  execute,
  component,
  validator,
  tests
};

// Default export for unified node registry
export default {
  definition,
  execute,
  component,
  validator,
  tests
};