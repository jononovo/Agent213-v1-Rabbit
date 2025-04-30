/**
 * Test suite for the Function Node
 * 
 * This file contains tests that verify the Function Node works correctly
 * in different execution scenarios.
 */
import { NodeTest, NodeTestResult } from '@/nodes/nodeTestsStandard';
import { execute } from './executor';

/**
 * A helper function to run the function node with specific settings and input
 */
async function runFunctionNode(
  code: string,
  input: any,
  useAsyncFunction: boolean = false,
  errorHandling: 'throw' | 'return' | 'null' = 'throw'
): Promise<any> {
  const result = await execute(
    {
      code,
      useAsyncFunction,
      errorHandling,
      timeout: 2000,
      cacheResults: false
    },
    {
      items: [{ json: input }],
      meta: {
        startTime: new Date(),
        endTime: new Date()
      }
    }
  );
  
  return result;
}

/**
 * Tests for the Function Node
 */
const tests: NodeTest[] = [
  {
    name: 'Basic Synchronous Function',
    description: 'Tests that a basic synchronous function executes correctly',
    category: 'core',
    async run(): Promise<NodeTestResult> {
      try {
        const code = `
          function process(input) {
            return { value: input.number * 2 };
          }
        `;
        
        const result = await runFunctionNode(code, { number: 5 }, false);
        const outputValue = result.items[0].json.value;
        
        if (outputValue === 10) {
          return {
            passed: true,
            message: 'Synchronous function executed successfully'
          };
        } else {
          return {
            passed: false,
            message: `Expected output value to be 10, got ${outputValue}`
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
    name: 'Basic Asynchronous Function',
    description: 'Tests that an asynchronous function executes correctly',
    category: 'core',
    async run(): Promise<NodeTestResult> {
      try {
        const code = `
          async function process(input) {
            // Simulate async operation
            const result = await new Promise(resolve => {
              setTimeout(() => resolve(input.number * 3), 100);
            });
            return { value: result };
          }
        `;
        
        const result = await runFunctionNode(code, { number: 5 }, true);
        const outputValue = result.items[0].json.value;
        
        if (outputValue === 15) {
          return {
            passed: true,
            message: 'Asynchronous function executed successfully'
          };
        } else {
          return {
            passed: false,
            message: `Expected output value to be 15, got ${outputValue}`
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
    name: 'Error Handling - Throw',
    description: 'Tests that errors are properly thrown when configured',
    category: 'error-handling',
    async run(): Promise<NodeTestResult> {
      try {
        const code = `
          function process(input) {
            throw new Error('Test error');
          }
        `;
        
        const result = await runFunctionNode(code, { number: 5 }, false, 'throw');
        
        // The error should be captured by the executor's error handling
        if (result.meta.error === true) {
          return {
            passed: true,
            message: 'Error was correctly handled with throw configuration'
          };
        } else {
          return {
            passed: false,
            message: 'Expected function to throw an error but it did not'
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
    name: 'Error Handling - Return',
    description: 'Tests that errors are returned when configured',
    category: 'error-handling',
    async run(): Promise<NodeTestResult> {
      try {
        const code = `
          function process(input) {
            throw new Error('Test error');
          }
        `;
        
        const result = await runFunctionNode(code, { number: 5 }, false, 'return');
        
        // The error should be returned in the result
        if (result.items[0].json.error === true && result.items[0].json.message) {
          return {
            passed: true,
            message: 'Error was correctly returned as a result'
          };
        } else {
          return {
            passed: false,
            message: 'Expected function to return an error object but it did not'
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
    name: 'Multi-item Processing',
    description: 'Tests that the function can process multiple input items',
    category: 'advanced',
    async run(): Promise<NodeTestResult> {
      try {
        const code = `
          function process(input, data) {
            // Also test access to all items via data parameter
            const allItems = data.items;
            return { 
              value: input.number * 2,
              itemCount: allItems.length
            };
          }
        `;
        
        // Create multiple items test
        const result = await execute(
          {
            code,
            useAsyncFunction: false,
            errorHandling: 'throw',
            timeout: 2000,
            cacheResults: false
          },
          {
            items: [
              { json: { number: 5 } },
              { json: { number: 10 } },
              { json: { number: 15 } }
            ],
            meta: {
              startTime: new Date(),
              endTime: new Date()
            }
          }
        );
        
        // Verify each item was processed correctly
        const allProcessed = result.items.every((item, index) => {
          const input = [5, 10, 15][index];
          return item.json.value === input * 2 && item.json.itemCount === 3;
        });
        
        if (allProcessed && result.items.length === 3) {
          return {
            passed: true,
            message: 'Multiple items were processed correctly'
          };
        } else {
          return {
            passed: false,
            message: 'Failed to process multiple items correctly'
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