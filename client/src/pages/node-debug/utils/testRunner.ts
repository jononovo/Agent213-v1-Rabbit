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
  integrationTestResults?: TestResult[]; // Add integration test results
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

export type TestType = 'definition' | 'interface' | 'execution' | 'error' | 'ui' | 'performance' | 'integration' |
  // New categories
  'structure' | 'error-handling' | 'file-structure' | 'metadata' | 'validation' | 'port-definition' | 'executor-signature' | 'output-format';

export interface TestDefinition {
  id: TestType;
  name: string;
  description: string;
  icon: React.ElementType;
}

// Import legacy test definitions for backward compatibility
import { LEGACY_STANDARD_TESTS } from './legacy-test-definitions';

/**
 * Load custom tests for a given node type
 */
export const loadCustomTests = async (nodeType: string): Promise<NodeTest[] | null> => {
  return loadNodeTests(nodeType);
};

/**
 * Run standard tests for a node
 */
export const runStandardTests = async (
  node: NodeType,
  onTestComplete: (node: NodeType) => void,
  updateNode: (updatedNode: NodeType) => void
): Promise<void> => {
  if (!node.testResults) return;
  
  // Set current node type and category on the window object for test context
  window.__currentTestingNode = {
    type: node.type,
    category: node.category
  };
  
  // Run each standard test
  for (let i = 0; i < standardNodeTests.length; i++) {
    const test = standardNodeTests[i];
    const testIndex = node.testResults.findIndex(t => t.name === test.name);
    
    if (testIndex === -1) continue; // Skip if test not found in results array
    
    try {
      // Mark test as running
      node.testResults[testIndex].status = 'running';
      updateNode({ ...node });
      
      // Measure test execution time
      const testStartTime = performance.now();
      const result = await test.run();
      const testDuration = Math.round(performance.now() - testStartTime);
      
      // Update test status
      node.testResults[testIndex] = {
        ...node.testResults[testIndex],
        status: result.passed ? 'passed' : 'failed',
        message: result.message,
        duration: testDuration
      };
      
      updateNode({ ...node });
      
      // Short delay between tests for UI update
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      // Handle test execution error
      node.testResults[testIndex] = {
        ...node.testResults[testIndex],
        status: 'failed',
        message: `Test execution error: ${error.message || String(error)}`
      };
      updateNode({ ...node });
    }
  }
  
  // Run integration tests for all nodes
  console.log(`Initializing integration tests for node: ${node.type}`);
  
  // Initialize integration test results array if it doesn't exist yet
  if (!node.integrationTestResults || node.integrationTestResults.length === 0) {
    node.integrationTestResults = [];
    
    if (node.category === 'Integration') {
      // For Integration nodes, run standard integration tests
      console.log('Adding integration tests for Integration node');
      integrationNodeTests.forEach(test => {
        node.integrationTestResults!.push({
          name: test.name,
          test: test.category as TestType,
          status: 'pending'
        });
      });
    } else {
      // For non-Integration nodes, add a single "Not Applicable" test
      console.log('Adding "Not Applicable" status for non-Integration node');
      node.integrationTestResults.push({
        name: 'Not Applicable',
        test: 'integration' as TestType,
        status: 'pending',
        message: 'This node is not in the Integration category'
      });
    }
    
    updateNode({ ...node });
  }
  
  // For Integration category nodes, run actual integration tests
  if (node.category === 'Integration') {
    console.log(`Found ${integrationNodeTests.length} integration tests to run`);
    
    for (let i = 0; i < integrationNodeTests.length; i++) {
      const test = integrationNodeTests[i];
      const testIndex = node.integrationTestResults.findIndex(t => t.name === test.name);
      
      if (testIndex === -1) continue; // Skip if test not found in results array
      
      try {
        // Mark test as running
        node.integrationTestResults[testIndex].status = 'running';
        updateNode({ ...node });
        
        // Measure test execution time
        const testStartTime = performance.now();
        const result = await test.run();
        const testDuration = Math.round(performance.now() - testStartTime);
        
        // Update test status
        node.integrationTestResults[testIndex] = {
          ...node.integrationTestResults[testIndex],
          status: result.passed ? 'passed' : 'failed',
          message: result.message,
          duration: testDuration
        };
        
        updateNode({ ...node });
        
        // Short delay between tests for UI update
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        // Handle test execution error
        node.integrationTestResults[testIndex] = {
          ...node.integrationTestResults[testIndex],
          status: 'failed',
          message: `Test execution error: ${error.message || String(error)}`
        };
        updateNode({ ...node });
      }
    }
  } else {
    // For non-Integration nodes, just mark the "Not Applicable" test as completed
    const testIndex = node.integrationTestResults.findIndex(t => t.name === 'Not Applicable');
    if (testIndex !== -1) {
      node.integrationTestResults[testIndex].status = 'pending';
      updateNode({ ...node });
    }
  }
  
  // All tests are complete
  onTestComplete(node);
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
    } catch (error: any) {
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
  const integrationFailures = node.integrationTestResults?.some(r => r.status === 'failed') || false;
  const hasFailures = standardFailures || customFailures || integrationFailures;
  
  if (hasFailures) {
    return 'failed';
  }
  
  const hasPending = 
    (node.testResults?.some(r => r.status === 'pending' || r.status === 'running') || false) ||
    (node.customTestResults?.some(r => r.status === 'pending' || r.status === 'running') || false) ||
    (node.integrationTestResults?.some(r => r.status === 'pending' || r.status === 'running') || false);
    
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
  updatedNode.integrationTestResults = [];
  
  // Add standard tests for all nodes
  standardNodeTests.forEach(test => {
    updatedNode.testResults?.push({
      name: test.name,
      test: test.category as TestType, // Map the test category to TestType
      status: 'running'
    });
    
    // Log test being added for debugging
    console.log(`Adding standard test: ${test.name} with category: ${test.category}`);
  });
  
  // Always initialize integration test results for all nodes
  console.log(`Initializing integration tests for node: ${node.type}`);
  
  // Initialize an empty array for integration tests
  updatedNode.integrationTestResults = [];
  
  if (node.category === 'Integration') {
    console.log(`Integration node tests available: ${integrationNodeTests.length}`);
    
    // Add standard integration tests if this is an Integration category node
    integrationNodeTests.forEach(test => {
      updatedNode.integrationTestResults!.push({
        name: test.name,
        test: test.category as TestType,
        status: 'running'
      });
      
      // Log integration test being added
      console.log(`Added integration test: ${test.name} with category: ${test.category}`);
    });
    
    // If we have no integration tests, add placeholder tests
    if (integrationNodeTests.length === 0) {
      console.log('No integration tests found, adding placeholders');
      
      // Add placeholder tests for integration capabilities
      updatedNode.integrationTestResults.push({
        name: 'Integration Capabilities',
        test: 'integration' as TestType,
        status: 'pending',
        message: 'Tests that the node defines its integration capabilities'
      });
      
      // Add placeholder tests for integration requirements
      updatedNode.integrationTestResults.push({
        name: 'Integration Requirements',
        test: 'integration' as TestType,
        status: 'pending',
        message: 'Tests that the node specifies its requirements'
      });
    }
  } else {
    // Add a special empty test for non-Integration nodes
    updatedNode.integrationTestResults.push({
      name: 'Not Applicable',
      test: 'integration' as TestType,
      status: 'pending',
      message: 'This node is not in the Integration category'
    });
  }
  
  console.log(`Added total of ${updatedNode.integrationTestResults.length} integration tests`);
  
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