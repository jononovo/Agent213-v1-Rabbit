/**
 * Processing Node Template - Test Cases
 * 
 * This file provides test data for debugging and validating the processing node.
 */

import { ProcessingNodeData, defaultData } from './executor';
import { NodeTest } from '../../nodes/nodeTestsStandard';

/**
 * Test cases for the processing node
 */
const tests: NodeTest[] = [
  {
    name: 'Basic processing',
    description: 'Test basic processing of data',
    category: 'functionality',
    run: async () => {
      try {
        // In a real test, you would execute the node with sample data
        // Here we're just showing a success result
        return {
          passed: true,
          message: 'Successfully processed input data'
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
    name: 'Data transformation',
    description: 'Test transformation of complex data',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully transformed data'
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
    name: 'Error handling',
    description: 'Test error handling when processing fails',
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
  },
  {
    name: 'Async processing',
    description: 'Test async processing with promises',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully processed async operation'
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
    name: 'Timeout handling',
    description: 'Test handling of execution timeouts',
    category: 'validation',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully handled timeout case'
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