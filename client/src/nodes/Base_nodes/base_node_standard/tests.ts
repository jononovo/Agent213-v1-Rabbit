/**
 * Base Standard Node Tests
 * 
 * This file contains test cases for the node-debug page.
 * These tests help validate the node's functionality.
 */

import { NodeTest } from '@/nodes/nodeTestsStandard';
import { execute, defaultData, BaseNodeData } from './executor';

/**
 * Test cases for the Base Standard Node
 * IMPORTANT: The tests array must be exported as the default export for automatic discovery
 */
const tests: NodeTest[] = [
  // Test 1: Basic Functionality
  {
    name: 'Basic functionality',
    description: 'Tests the core node functionality with default settings',
    category: 'functionality',
    run: async () => {
      try {
        // Set up node data for testing
        const nodeData: BaseNodeData = {
          ...defaultData
        };
        
        // Create test input data
        const inputs = {
          input: {
            items: [{ json: { text: 'test input' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Execute the node with test data
        const result = await execute(nodeData, inputs);
        
        // Validate the results
        if (!result.output?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'No output data was returned'
          };
        }
        
        // Check if output is as expected
        const outputJson = result.output.items[0].json;
        if ('error' in outputJson) {
          return {
            passed: false,
            message: `Error in output: ${outputJson.error}`
          };
        }
        
        const outputText = outputJson.text;
        if (!outputText.includes('test input')) {
          return {
            passed: false,
            message: `Output does not contain input text: ${outputText}`
          };
        }
        
        return {
          passed: true,
          message: 'Node successfully processed input'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 2: Input Validation
  {
    name: 'Input validation',
    description: 'Tests how the node handles empty input',
    category: 'validation',
    run: async () => {
      try {
        // Create node data with default settings
        const nodeData: BaseNodeData = {
          ...defaultData
        };
        
        // Create empty input
        const inputs = {
          input: {
            items: [{ json: { text: '' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Execute the node
        const result = await execute(nodeData, inputs);
        
        // Validate the results
        if (!result.output?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'No output data was returned'
          };
        }
        
        // Check if output is as expected
        const outputJson = result.output.items[0].json;
        if ('error' in outputJson) {
          return {
            passed: false,
            message: `Error in output: ${outputJson.error}`
          };
        }
        
        return {
          passed: true,
          message: 'Node correctly processed empty input'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  
  // Test 3: Configuration Options
  {
    name: 'Configuration settings',
    description: 'Tests that node configuration affects output',
    category: 'functionality',
    run: async () => {
      try {
        // Create custom configuration
        const nodeData: BaseNodeData = {
          ...defaultData,
          setting1: 'CUSTOM',
          setting3: false // This should make text lowercase in our example
        };
        
        // Create test input data
        const inputs = {
          input: {
            items: [{ json: { text: 'TEST TEXT' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Execute the node
        const result = await execute(nodeData, inputs);
        
        // Validate the results
        if (!result.output?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'No output data was returned'
          };
        }
        
        // Check if output is as expected
        const outputJson = result.output.items[0].json;
        if ('error' in outputJson) {
          return {
            passed: false,
            message: `Error in output: ${outputJson.error}`
          };
        }
        
        const outputText = outputJson.text;
        // With setting3=false, text should be lowercase
        if (!outputText.includes('test text')) {
          return {
            passed: false,
            message: `Output didn't reflect configuration settings: ${outputText}`
          };
        }
        
        return {
          passed: true,
          message: 'Node correctly applied configuration settings'
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