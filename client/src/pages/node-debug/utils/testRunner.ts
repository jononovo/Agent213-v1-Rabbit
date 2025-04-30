/**
 * Test Runner Utilities
 * 
 * This file contains utilities for running both standard and custom tests
 * for nodes in the system. It separates the test execution logic from the UI.
 */
import { loadNodeTests } from '../../../lib/nodeTestLoader';
import { NodeTest, NodeTestResult } from '../../../nodes/nodeTestsStandard';
import { standardNodeTests, integrationNodeTests } from './standardTests';

// Types imported from the main page
export interface NodeType {
  type: string;
  name: string;
  category: string;
  status?: 'validated' | 'partial' | 'failed' | 'pending';
  testResults?: TestResult[];
  customTestResults?: CustomTestResult[];
  customFolder?: string; // Path to custom folder for folder-based nodes
}

export interface TestResult {
  name: string;
  test: TestType;
  status: 'passed' | 'failed' | 'pending' | 'running';
  message?: string;
  duration?: number; 
}

export interface CustomTestResult {
  name: string;
  description: string;
  category?: string;
  status: 'passed' | 'failed' | 'pending' | 'running';
  message?: string;
  duration?: number;
  details?: Record<string, any>;
}

export type TestType = 'definition' | 'interface' | 'execution' | 'error' | 'ui' | 'performance' | 'integration';

export interface TestDefinition {
  id: TestType;
  name: string;
  description: string;
  icon: React.ElementType;
}

// Standard test definitions - updated for BaseNode compatibility
export const STANDARD_TESTS: Omit<TestDefinition, 'icon'>[] = [
  {
    id: 'definition',
    name: 'BaseNode Definition',
    description: 'Verifies the node follows BaseNode structure and has all required base properties'
  },
  {
    id: 'interface',
    name: 'Type-Safe Interface',
    description: 'Tests the input/output ports match the TypeScript definitions'
  },
  {
    id: 'execution',
    name: 'Executor Validation',
    description: 'Verifies the node executor properly processes inputs and generates outputs'
  },
  {
    id: 'error',
    name: 'Error Handling',
    description: 'Tests how the node handles invalid inputs and creates proper error outputs'
  },
  {
    id: 'ui',
    name: 'UI Component',
    description: 'Validates the node has required UI components for the builder interface'
  },
  {
    id: 'performance',
    name: 'Resource Efficiency',
    description: 'Measures execution time and checks resource usage meets standards'
  },
  {
    id: 'integration',
    name: 'Integration Flow',
    description: 'Tests the node properly integrates with other nodes in the workflow'
  }
];

/**
 * Load custom tests for a given node type
 */
export const loadCustomTests = async (nodeType: string): Promise<NodeTest[] | null> => {
  return loadNodeTests(nodeType);
};

/**
 * Run custom tests for a node
 */
export const runCustomTests = async (
  node: NodeType, 
  customTests: NodeTest[],
  onTestComplete: (node: NodeType) => void,
  updateNode: (updatedNode: NodeType) => void
): Promise<void> => {
  if (!node.customTestResults) return;
  
  // Run each custom test for real (not simulated)
  for (let i = 0; i < customTests.length; i++) {
    const customTest = customTests[i];
    
    try {
      // Actually run the test
      const testStartTime = performance.now();
      const result = await customTest.run();
      const testDuration = Math.round(performance.now() - testStartTime);
      
      // Convert to our internal format
      const customResult: CustomTestResult = {
        name: customTest.name,
        description: customTest.description,
        category: customTest.category,
        status: result.passed ? 'passed' : 'failed',
        message: result.message,
        duration: testDuration,
        details: result.details
      };
      
      // Update the node's custom test results
      node.customTestResults[i] = customResult;
      updateNode({ ...node });
      
      // Short delay between tests for UI update
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      // Handle test execution error
      node.customTestResults[i] = {
        name: customTest.name,
        description: customTest.description,
        category: customTest.category,
        status: 'failed',
        message: `Test execution error: ${error instanceof Error ? error.message : String(error)}`
      };
      updateNode({ ...node });
    }
  }
  
  // Custom tests are complete
  onTestComplete(node);
};

/**
 * Calculate overall test status based on test results
 */
export const calculateTestStatus = (node: NodeType): 'validated' | 'partial' | 'failed' => {
  const standardFailures = node.testResults?.some(r => r.status === 'failed') || false;
  const customFailures = node.customTestResults?.some(r => r.status === 'failed') || false;
  const hasFailures = standardFailures || customFailures;
  
  if (hasFailures) {
    return 'failed';
  }
  
  const hasPending = 
    (node.testResults?.some(r => r.status === 'pending' || r.status === 'running') || false) ||
    (node.customTestResults?.some(r => r.status === 'pending' || r.status === 'running') || false);
    
  if (hasPending) {
    return 'partial';
  }
  
  return 'validated';
};

/**
 * Initialize a node for testing by setting up test result arrays
 */
export const initNodeForTesting = (
  node: NodeType, 
  customTests: NodeTest[] | null
): NodeType => {
  const updatedNode = { ...node };
  const hasCustomTests = customTests && customTests.length > 0;
  
  // Reset test results
  updatedNode.testResults = [];
  updatedNode.customTestResults = [];
  
  // Set up standard tests
  STANDARD_TESTS.forEach(test => {
    updatedNode.testResults?.push({
      name: test.name,
      test: test.id,
      status: 'running'
    });
  });
  
  // Set up custom tests if available
  if (hasCustomTests && customTests) {
    customTests.forEach(test => {
      updatedNode.customTestResults?.push({
        name: test.name,
        description: test.description,
        category: test.category,
        status: 'running'
      });
    });
  }
  
  return updatedNode;
};