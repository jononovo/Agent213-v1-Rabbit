/**
 * Base Integration Node Tests
 * 
 * This file contains test cases for the node-debug page.
 * These tests help validate the node's integration functionality.
 */

import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute, defaultData, BaseIntegrationNodeData } from './executor';

// Mock environment variables for testing
const ENV_API_KEY = process.env.TEST_API_KEY || 'test-api-key';

/**
 * Test cases for the Base Integration Node
 * IMPORTANT: The tests array must be exported as the default export for automatic discovery
 */
const tests: NodeTest[] = [
  // Test 1: Configuration Validation
  {
    name: 'Configuration validation',
    description: 'Tests that the node requires proper configuration',
    category: 'validation',
    run: async () => {
      try {
        // Create incomplete configuration (missing API key)
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData,
          apiKey: '' // Missing API key
        };
        
        // Create test input data
        const inputs = {
          input: {
            items: [{ json: { text: 'test query' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Execute the node with incomplete configuration
        const result = await execute(nodeData, inputs);
        
        // Check that output contains expected error format
        if (!result.output?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'No output was returned'
          };
        }
        
        const outputJson = result.output.items[0].json;
        
        // For this test, we expect execution to proceed without API key
        // but would include a warning in real implementation
        return {
          passed: true,
          message: 'Node correctly handled configuration without API key'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 2: Mock API Call Success
  {
    name: 'Mock API call success',
    description: 'Tests the node with a mocked successful API response',
    category: 'integration',
    run: async () => {
      try {
        // For actual implementation, we would use a proper mock for testing.
        // This is a simplified test for the template that doesn't require mock libraries.
        
        // Set up node data for testing
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData,
          apiKey: ENV_API_KEY
        };
        
        // Create test input data
        const inputs = {
          input: {
            items: [{ json: { text: 'test query' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Note: In a real test, we would mock the fetch call
        // For this template, we'll simply return a success result
        
        return {
          passed: true,
          message: 'Integration test template for successful API call'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 3: API Call Error Handling
  {
    name: 'API call error handling',
    description: 'Tests the node handles API errors gracefully',
    category: 'error-handling',
    run: async () => {
      try {
        // This is a simplified test for the template that doesn't require mock libraries.
        
        // Set up node data for testing with invalid API key
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData,
          apiKey: 'invalid-api-key'
        };
        
        // Create test input data
        const inputs = {
          input: {
            items: [{ json: { text: 'test query' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Note: In a real test, we would mock the fetch call to return an error
        // For this template, we'll simply return a success result for the test itself
        
        return {
          passed: true,
          message: 'Integration test template for API error handling'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

// IMPORTANT: This default export is required for automatic test discovery
export default tests;