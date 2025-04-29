/**
 * Base Integration Node Tests
 * 
 * This file contains test cases for the integration node.
 * These tests help validate the node's functionality in the node-debug page.
 * Based on the Perplexity API node test structure for reference.
 */

import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute, defaultData, BaseIntegrationNodeData } from './executor';

/**
 * Test cases for the Base Integration Node
 * IMPORTANT: The tests array must be exported as the default export for automatic discovery
 */
const tests: NodeTest[] = [
  // Test 1: Basic API Request Functionality
  {
    name: 'Basic API request',
    description: 'Tests making a basic API request through the Integration Engine',
    category: 'functionality',
    run: async () => {
      try {
        // Create test node data with a mock API endpoint
        // Replace this with an actual public API for your specific integration
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData,
          apiEndpoint: 'https://jsonplaceholder.typicode.com/posts/1', // Example public API
          method: 'GET',
          useAuth: false // No auth for this public API
        };
        
        // Create test input
        const inputs = {
          input: {
            items: [{ json: { text: 'test query' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Execute the node
        const result = await execute(nodeData, inputs);
        
        // Check for valid response in the output
        if (!result.output?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'No output data returned from API request'
          };
        }
        
        // Check metadata output
        if (!result.metadata?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'No metadata returned from API request'
          };
        }
        
        return {
          passed: true,
          message: 'Successfully made API request and received response'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 2: Registration Process
  {
    name: 'Integration registration',
    description: 'Tests registering the node with the Integration Engine',
    category: 'integration',
    run: async () => {
      try {
        // Create test node data
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData
        };
        
        // Mock workflow context
        const context = {
          workflowId: 999, // Mock ID
          nodeId: 'test-node-id'
        };
        
        // Execute the node with context but no inputs
        const result = await execute(nodeData, {}, context);
        
        // Check for valid registration response
        if (!result.metadata?.items?.[0]?.json?.registration) {
          return {
            passed: false,
            message: 'No registration data returned'
          };
        }
        
        return {
          passed: true,
          message: 'Successfully registered with Integration Engine'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 3: Error Handling
  {
    name: 'Error handling',
    description: 'Tests how the node handles API errors',
    category: 'error-handling',
    run: async () => {
      try {
        // Create test node data with invalid endpoint
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData,
          apiEndpoint: 'https://invalid-domain-that-does-not-exist.example', // Invalid domain
          method: 'GET',
          useAuth: false
        };
        
        // Create test input
        const inputs = {
          input: {
            items: [{ json: { text: 'test query' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Execute the node - should handle the error gracefully
        const result = await execute(nodeData, inputs);
        
        // Check for error flag in metadata
        if (!result.output?.meta?.error) {
          return {
            passed: false,
            message: 'Node did not properly flag the API error'
          };
        }
        
        // Check for error message
        if (!result.output?.meta?.errorMessage) {
          return {
            passed: false,
            message: 'Node did not provide an error message'
          };
        }
        
        return {
          passed: true,
          message: 'Node correctly handled and reported API error'
        };
      } catch (error) {
        // This shouldn't happen - the node should handle errors internally
        return {
          passed: false,
          message: `Test failure - node didn't contain error: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 4: Missing Context Validation
  {
    name: 'Context validation',
    description: 'Tests that the node validates workflow context requirements',
    category: 'validation',
    run: async () => {
      try {
        // Create node data
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData
        };
        
        // Execute with no inputs and no context
        // This should return an error since it needs one or the other
        const result = await execute(nodeData);
        
        // Check that an error was properly returned
        if (!result.output?.meta?.error) {
          return {
            passed: false,
            message: 'Node did not properly handle missing context and inputs'
          };
        }
        
        return {
          passed: true,
          message: 'Node correctly validated context requirements'
        };
      } catch (error) {
        // This shouldn't happen - the node should handle errors internally
        return {
          passed: false,
          message: `Test failure - error not contained: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 5: Authentication Requirements
  {
    name: 'Authentication configuration',
    description: 'Verifies authentication options are properly configured',
    category: 'configuration',
    run: async () => {
      try {
        // Create node data with authentication enabled but no key
        const nodeData: BaseIntegrationNodeData = {
          ...defaultData,
          useAuth: true,
          apiKey: '' // Explicitly empty
        };
        
        // Create context to trigger registration
        const context = {
          workflowId: 999,
          nodeId: 'test-node-id'
        };
        
        // Execute - should handle missing API key appropriately
        const result = await execute(nodeData, {}, context);
        
        // The result should still have valid registration info
        // But might include a warning about missing API key
        if (!result.output?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'Node failed to handle authentication configuration'
          };
        }
        
        return {
          passed: true,
          message: 'Node properly configured authentication options'
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