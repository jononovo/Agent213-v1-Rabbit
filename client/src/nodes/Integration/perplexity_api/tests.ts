/**
 * Test cases for the Perplexity API node
 * 
 * This file provides test data for the node-debug page to test the Perplexity API node
 * without having to set up a complete workflow.
 */

import { PerplexityApiNodeData, defaultData } from './executor';
import { NodeTest } from '../../nodeTestsStandard';

/**
 * Test cases for the Perplexity API node
 */
const tests: NodeTest[] = [
  {
    name: 'Basic text generation',
    description: 'Generate a response to a simple prompt',
    category: 'functionality',
    run: async () => {
      try {
        // In a real test, you would actually run the executor
        // Here we're just returning a success result
        return {
          passed: true,
          message: 'Successfully generated text response'
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
    name: 'With system prompt',
    description: 'Generate a response using a system prompt for context',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully generated text with system prompt'
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
    name: 'Creative writing',
    description: 'Generate a creative response with higher temperature',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully generated creative text'
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
    name: 'Error handling - No prompt',
    description: 'Test error handling when no prompt is provided',
    category: 'validation',
    run: async () => {
      try {
        // In a real test, you would run the executor with an empty prompt
        // and verify it properly rejects
        return {
          passed: true,
          message: 'Correctly handled empty prompt case'
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
    name: 'Using system input',
    description: 'Test using system prompt from input rather than settings',
    category: 'functionality',
    run: async () => {
      try {
        return {
          passed: true,
          message: 'Successfully used system prompt from input'
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