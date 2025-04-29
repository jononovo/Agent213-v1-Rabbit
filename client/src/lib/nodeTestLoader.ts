/**
 * Node Test Loader
 * 
 * This file dynamically discovers and loads test cases for all nodes in the system.
 * It's used by the node-debug page to populate the test interface.
 */

import { NodeTest, NodeTestSuite } from '@/nodes/types';

// Type definitions for dynamic imports
type NodeModule = {
  tests?: NodeTest[];
  default?: NodeTest[];
};

/**
 * Dynamically discover and load test cases for all nodes
 * 
 * This function:
 * 1. Searches for test files in node directories
 * 2. Imports the tests from those files
 * 3. Organizes them by node type
 * 
 * @returns A promise resolving to an object with node types as keys and test arrays as values
 */
export async function loadNodeTests(): Promise<NodeTestSuite> {
  const testSuite: NodeTestSuite = {};
  
  try {
    // Use Vite's glob import to find all test files
    // This finds any file named tests.ts in node directories
    const testModules = import.meta.glob('../nodes/**/**/tests.ts');
    
    // Load each test file
    const loadPromises = Object.entries(testModules).map(async ([path, importFn]) => {
      try {
        // Extract node type from path
        // Pattern: ../nodes/Category/node_type/tests.ts
        const pathParts = path.split('/');
        // Get the node type from the directory name (second to last part)
        const nodeType = pathParts[pathParts.length - 2];
        
        // Skip if nodeType is invalid or doesn't look like a node type
        if (!nodeType || nodeType === 'tests' || nodeType.includes('.')) {
          return;
        }
        
        // Import the test module
        const module = await importFn() as NodeModule;
        
        // Get tests from the module (either as default export or named export)
        const tests = module.default || module.tests;
        
        // Skip if no tests found
        if (!tests || !Array.isArray(tests) || tests.length === 0) {
          console.warn(`No tests found in ${path}`);
          return;
        }
        
        // Add tests to the suite
        testSuite[nodeType] = tests;
        console.log(`Loaded ${tests.length} tests for node type: ${nodeType}`);
      } catch (error) {
        console.error(`Error loading tests from ${path}:`, error);
      }
    });
    
    // Wait for all imports to complete
    await Promise.all(loadPromises);
    
    return testSuite;
  } catch (error) {
    console.error('Error loading node tests:', error);
    return {};
  }
}

/**
 * Get categories for grouping tests in the UI
 * 
 * @param tests Array of tests from a node
 * @returns Array of unique categories
 */
export function getTestCategories(tests: NodeTest[]): string[] {
  // Extract unique categories
  const categories = new Set<string>();
  tests.forEach(test => {
    if (test.category) {
      categories.add(test.category);
    }
  });
  
  return Array.from(categories);
}

/**
 * Filter tests by category
 * 
 * @param tests Array of tests
 * @param category Category to filter by
 * @returns Filtered array of tests
 */
export function filterTestsByCategory(tests: NodeTest[], category: string): NodeTest[] {
  return tests.filter(test => test.category === category);
}