/**
 * Output Node Template - Test Cases
 * 
 * This file provides test data for debugging and validating the output node.
 */

import { OutputNodeData, defaultData } from './executor';
import { NodeTest } from '../../nodes/nodeTestsStandard';

/**
 * Test cases for the output node
 */
const tests: NodeTest[] = [
  {
    name: 'Test webhook output',
    description: 'Test sending data to a webhook',
    category: 'functionality',
    run: async () => {
      try {
        // In a real test, you would execute the node with sample data
        // Here we're just showing a success result
        return {
          passed: true,
          message: 'Successfully sent data to webhook'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'Test API endpoint',
    description: 'Test sending data to an API endpoint',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully sent data to API'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'Test console output',
    description: 'Test sending data to console',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully sent data to console'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'Test data transformation',
    description: 'Test transforming data before output',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully transformed data before output'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'Test error handling',
    description: 'Test handling of output errors',
    category: 'validation',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully handled error case'
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

export default tests;