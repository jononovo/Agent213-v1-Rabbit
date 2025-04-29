/**
 * Base Integration Node Index
 * 
 * This file exports all components of the node.
 * It's the entry point for node registration.
 */

import { definition } from './definition';
import { execute, registerWithIntegrationEngine } from './executor';
import { component } from './ui';
import tests from './tests';

// Initialize integration if applicable
try {
  registerWithIntegrationEngine();
} catch (error) {
  console.error('Failed to register with Integration Engine:', error);
}

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