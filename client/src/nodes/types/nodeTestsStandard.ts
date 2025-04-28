/**
 * Standard interface for node-specific tests
 * 
 * This file defines the interfaces that all node test implementations
 * should conform to, providing a consistent testing structure across
 * the system.
 */

/**
 * Interface for a node test
 * Each test has a unique name, description, category, and execution function
 */
export interface NodeTest {
  /**
   * Name of the test, e.g. "Input Validation"
   */
  name: string;

  /**
   * Detailed description of what the test validates
   */
  description: string;

  /**
   * Optional category to group tests, e.g. "validation", "performance", "api"
   */
  category?: string;

  /**
   * Function that runs the actual test and returns a result
   */
  run: () => Promise<NodeTestResult>;
}

/**
 * Result of running a node test
 */
export interface NodeTestResult {
  /**
   * Whether the test passed or failed
   */
  passed: boolean;

  /**
   * Human-readable message describing the test result
   */
  message: string;

  /**
   * Optional detailed information about the test
   * Can include input/output data, execution metrics, etc.
   */
  details?: Record<string, any>;
}

/**
 * A collection of tests for a specific node
 */
export type NodeTestSuite = NodeTest[];

export default NodeTestSuite;