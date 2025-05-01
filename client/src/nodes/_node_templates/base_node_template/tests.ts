/**
 * Base Node Template Tests
 * 
 * This file contains custom tests for the base node template.
 * These tests verify node-specific functionality beyond the standard tests.
 */

import { NodeTest, NodeTestResult } from '../../nodeTestsStandard';
import { execute } from './executor';
import { defaultData } from './definition';

/**
 * Custom test suite for the base node template
 * Uses the standardized NodeTest interface
 */
const tests: NodeTest[] = [
  {
    name: 'Input Passthrough',
    description: 'Verifies that the node correctly passes through input data',
    category: 'functionality',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Create test input with the BaseExecutor format
        const testInput = {
          input: {
            items: [{ json: { testProperty: 'testValue' } }],
            meta: { startTime: new Date(), endTime: new Date() }
          }
        };
        
        // Execute the node with test input
        const result = await execute(defaultData, testInput);
        
        // Verify output matches expected format
        const outputValue = result.items[0]?.json;
        
        if (outputValue?.testProperty === 'testValue') {
          return {
            passed: true,
            message: 'Node correctly passed through input data'
          };
        } else {
          return {
            passed: false,
            message: `Expected output to contain input property, but got: ${JSON.stringify(outputValue)}`
          };
        }
      } catch (error) {
        return {
          passed: false,
          message: `Test error: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'Empty Input Handling',
    description: 'Verifies that the node properly handles empty input',
    category: 'error-handling',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Execute the node with empty input (using BaseExecutor format)
        const result = await execute(defaultData, {});
        
        // Verify proper default response
        const outputValue = result.items[0]?.json;
        
        if (outputValue && typeof outputValue === 'object' && 'message' in outputValue) {
          return {
            passed: true,
            message: 'Node correctly handled empty input'
          };
        } else {
          return {
            passed: false,
            message: `Expected output to contain default message, but got: ${JSON.stringify(outputValue)}`
          };
        }
      } catch (error) {
        return {
          passed: false,
          message: `Test error: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

export default tests;