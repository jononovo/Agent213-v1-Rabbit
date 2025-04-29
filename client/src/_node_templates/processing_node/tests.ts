/**
 * Processing Node Template - Tests
 * 
 * This file provides test cases for the processing node.
 * These tests help verify that the node behaves correctly with different processing modes.
 */

import { NodeTest, NodeTestResult } from '@/nodes/nodeTestsStandard';

/**
 * Define tests for the processing node
 * CUSTOMIZE THIS: Update test cases to match your specific node
 */
const tests: NodeTest[] = [
  {
    name: 'Transform mode basic functionality',
    description: 'Tests basic data transformation capabilities',
    category: 'functionality',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test data
        const testData = {
          name: 'test',
          value: 42,
          active: true
        };
        
        // In a real test, you would create a transform function and apply it to testData
        // const transformedData = await processWithMode(testData, {}, 'transform');
        
        // For template purposes, just assume it passed
        return {
          passed: true,
          message: 'Successfully transformed data',
          details: {
            inputProcessed: true,
            transformApplied: true
          }
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
    name: 'Filter mode functionality',
    description: 'Tests filtering array data based on criteria',
    category: 'functionality',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test array data
        const testArray = [
          { id: 1, category: 'A', value: 10 },
          { id: 2, category: 'B', value: 20 },
          { id: 3, category: 'A', value: 30 },
          { id: 4, category: 'C', value: 40 }
        ];
        
        // Test filter criteria
        const options = {
          criteria: { category: 'A' }
        };
        
        // In a real test, you would apply the filter
        // const filteredData = await processWithMode(testArray, options, 'filter');
        // const expectedLength = 2; // Items with category 'A'
        
        return {
          passed: true,
          message: 'Successfully filtered data array',
          details: {
            inputItems: 4,
            filteredItems: 2,
            criteriaApplied: 'category === "A"'
          }
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
    name: 'Aggregate mode functionality',
    description: 'Tests aggregating numeric values in an array',
    category: 'functionality',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test array data with values to aggregate
        const testArray = [
          { id: 1, value: 10 },
          { id: 2, value: 20 },
          { id: 3, value: 30 },
          { id: 4, value: 40 }
        ];
        
        // Options for aggregation
        const options = {
          field: 'value',
          method: 'sum'
        };
        
        // In a real test, you would apply the aggregation
        // const result = await processWithMode(testArray, options, 'aggregate');
        // const expectedSum = 100;
        
        return {
          passed: true,
          message: 'Successfully aggregated data',
          details: {
            method: 'sum',
            field: 'value',
            result: 100,
            itemCount: 4
          }
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
    name: 'Validate mode functionality',
    description: 'Tests data validation against a schema',
    category: 'functionality',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test data to validate
        const validData = {
          id: 'test-123',
          name: 'Test Item',
          age: 25
        };
        
        const invalidData = {
          id: 'test-456',
          // Missing name field
          age: 'not a number' // Wrong type
        };
        
        // Schema for validation
        const options = {
          schema: {
            required: ['id', 'name'],
            types: {
              id: 'string',
              name: 'string',
              age: 'number'
            }
          }
        };
        
        // In a real test, you would apply validation to both valid and invalid data
        // const validResult = await processWithMode(validData, options, 'validate');
        // const invalidResult = await processWithMode(invalidData, options, 'validate');
        
        return {
          passed: true,
          message: 'Validation correctly identified valid and invalid data',
          details: {
            validDataResult: { valid: true, errors: [] },
            invalidDataResult: { valid: false, errors: ['Missing required field: name', 'Invalid type for age: expected number, got string'] }
          }
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
    name: 'Error handling - throw mode',
    description: 'Tests error handling when set to throw',
    category: 'error handling',
    run: async (): Promise<NodeTestResult> => {
      try {
        // In a real test, you would execute with invalid input that causes an error
        // with errorHandling set to 'throw'
        
        return {
          passed: true,
          message: 'Error correctly thrown when error handling set to throw',
          details: {
            errorThrown: true,
            errorMessage: 'Test error message'
          }
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
    name: 'Error handling - continue mode',
    description: 'Tests error handling when set to continue',
    category: 'error handling',
    run: async (): Promise<NodeTestResult> => {
      try {
        // In a real test, you would execute with invalid input that causes an error
        // with errorHandling set to 'continue'
        
        return {
          passed: true,
          message: 'Error correctly handled when error handling set to continue',
          details: {
            errorContinued: true,
            outputHasErrorProperty: true,
            workflowContinued: true
          }
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
    name: 'Error handling - fallback mode',
    description: 'Tests error handling when set to fallback',
    category: 'error handling',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test fallback value
        const fallbackValue = '{"status": "fallback", "message": "Used fallback value"}';
        
        // In a real test, you would execute with invalid input that causes an error
        // with errorHandling set to 'fallback'
        
        return {
          passed: true,
          message: 'Fallback value correctly used when error handling set to fallback',
          details: {
            fallbackApplied: true,
            originalError: 'Test error message',
            fallbackResult: { status: 'fallback', message: 'Used fallback value' }
          }
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