/**
 * Standard Node Test Types
 * 
 * This file defines the standard types for node tests used across all nodes.
 * It provides a common interface for test definition, execution, and result reporting.
 */

// Node test result interface 
export interface NodeTestResult {
  passed: boolean;
  message: string;
  error?: string;
}

// Node test interface
export interface NodeTest {
  name: string;
  description: string;
  category: string;
  run: () => Promise<NodeTestResult>;
}

// Node test suite interface
export interface NodeTestSuite {
  [key: string]: NodeTest[];
}