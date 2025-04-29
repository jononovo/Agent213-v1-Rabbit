/**
 * Base Integration Node Index
 * 
 * This file exports all components of the node.
 * It's the entry point for node registration.
 */

import { definition } from './definition';
import { execute } from './executor';
import { component } from './ui';
import tests from './tests';

// Note: The Integration Engine automatically registers nodes with integrationConfig
// No explicit registration is needed as the engine scans for nodes with this configuration

// Export individual components
export { 
  definition,
  execute,
  component,
  tests
};

// Default export for unified node registry
export default {
  definition,
  execute,
  component,
  tests
};