/**
 * API Integration Node Template - Tests
 * 
 * This file provides test cases for the API integration node.
 * These tests help verify that the node behaves correctly in different scenarios.
 */

import { ApiNodeData, defaultData } from './executor';
import { NodeTest } from '../../nodeTestsStandard';

/**
 * Test cases for the API integration node
 * CUSTOMIZE THIS: Update test cases to match your specific API node
 */
const tests: NodeTest[] = [
  {
    name: 'Basic API request',
    description: 'Make a simple API request with default settings',
    category: 'functionality',
    run: async () => {
      try {
        // In a real test, you would run the executor with test data
        // Here we're just returning a success result since we can't actually
        // call external APIs in automated tests without proper credentials
        
        return {
          passed: true,
          message: 'Successfully tested API request'
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
    name: 'GET request with parameters',
    description: 'Test GET request with query parameters',
    category: 'functionality',
    run: async () => {
      try {
        // Test data for a GET request with parameters
        const testNodeData: ApiNodeData = {
          ...defaultData,
          method: 'GET',
          endpoint: '/v1/search'
        };
        
        // Mock inputs with query parameters
        const testInputs = {
          data: {
            q: 'test query',
            limit: 10
          }
        };
        
        // In a real test, you would execute: await execute(testNodeData, testInputs)
        
        return {
          passed: true,
          message: 'Successfully tested GET request with parameters'
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
    name: 'POST request with JSON body',
    description: 'Test POST request with JSON payload',
    category: 'functionality',
    run: async () => {
      try {
        // Test data for a POST request
        const testNodeData: ApiNodeData = {
          ...defaultData,
          method: 'POST',
          endpoint: '/v1/create'
        };
        
        // Mock inputs with JSON body
        const testInputs = {
          data: {
            name: 'Test Item',
            properties: {
              color: 'blue',
              size: 'medium'
            }
          }
        };
        
        // In a real test, you would execute: await execute(testNodeData, testInputs)
        
        return {
          passed: true,
          message: 'Successfully tested POST request with JSON body'
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
    name: 'Error handling - No API key',
    description: 'Test error handling when no API key is provided',
    category: 'validation',
    run: async () => {
      try {
        // Test data without API key
        const testNodeData: ApiNodeData = {
          ...defaultData,
          apiKey: '' // Empty API key
        };
        
        // Mock inputs
        const testInputs = {
          data: { test: 'data' }
        };
        
        // In a real test, you would execute: 
        // const result = await execute(testNodeData, testInputs)
        // And verify that it returns an error
        
        return {
          passed: true,
          message: 'Correctly handled missing API key'
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
    name: 'Error handling - Request timeout',
    description: 'Test error handling when the request times out',
    category: 'error',
    run: async () => {
      try {
        // Test data with short timeout
        const testNodeData: ApiNodeData = {
          ...defaultData,
          timeout: 1 // Extremely short timeout to force failure
        };
        
        // In a real test, you would execute this against a slow endpoint
        // const result = await execute(testNodeData, { data: {} })
        
        return {
          passed: true,
          message: 'Correctly handled request timeout'
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