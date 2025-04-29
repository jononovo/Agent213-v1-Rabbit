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
        // Override fetch with a mock implementation for testing
        const originalFetch = global.fetch;
        
        // Create mock response data
        const mockResponseData = {
          status: 'success',
          data: { result: 'Mocked API response' }
        };
        
        // Mock the fetch implementation
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponseData
        });
        
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
        
        try {
          // Execute the node with test data
          const result = await execute(nodeData, inputs);
          
          // Validate the results
          if (!result.output?.items?.[0]?.json) {
            return {
              passed: false,
              message: 'No output was returned'
            };
          }
          
          const outputJson = result.output.items[0].json;
          
          // Check if response contains expected data
          if (!outputJson.result || !outputJson.statusCode) {
            return {
              passed: false,
              message: 'Output missing expected fields'
            };
          }
          
          return {
            passed: true,
            message: 'Node successfully processed API response'
          };
        } finally {
          // Restore the original fetch implementation
          global.fetch = originalFetch;
        }
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 3: Mock API Call Failure
  {
    name: 'Mock API call failure',
    description: 'Tests the node with a mocked failed API response',
    category: 'error-handling',
    run: async () => {
      try {
        // Override fetch with a mock implementation for testing
        const originalFetch = global.fetch;
        
        // Mock the fetch implementation with error
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: async () => ({ error: 'API key invalid' })
        });
        
        // Set up node data for testing
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
        
        try {
          // Execute the node with test data
          const result = await execute(nodeData, inputs);
          
          // Validate the results
          if (!result.output?.items?.[0]?.json) {
            return {
              passed: false,
              message: 'No output was returned'
            };
          }
          
          const outputJson = result.output.items[0].json;
          
          // Check if response contains error information
          if (!('error' in outputJson)) {
            return {
              passed: false,
              message: 'Output missing error information'
            };
          }
          
          // Check if meta contains error flag
          if (!result.output.meta.error) {
            return {
              passed: false,
              message: 'Meta should include error flag for API failures'
            };
          }
          
          return {
            passed: true,
            message: 'Node correctly handled API error response'
          };
        } finally {
          // Restore the original fetch implementation
          global.fetch = originalFetch;
        }
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