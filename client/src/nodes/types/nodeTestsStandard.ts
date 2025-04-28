/**
 * Standard interface for custom node-specific tests
 * 
 * This file defines the standard interface for node-specific tests.
 * Each node can provide its own test suite to verify its functionality.
 */

/**
 * Interface for a single node test
 */
export interface NodeTest {
  // Test name
  name: string;
  
  // Test description
  description: string;
  
  // Optional test category
  category?: string;
  
  // Function that runs the test and returns result
  run: () => Promise<NodeTestResult>;
}

/**
 * Result of running a node test
 */
export interface NodeTestResult {
  // Whether the test passed
  passed: boolean;
  
  // Message explaining the result (especially useful for failures)
  message: string;
  
  // Optional details for display (can include execution time, inputs/outputs, etc.)
  details?: Record<string, any>;
}