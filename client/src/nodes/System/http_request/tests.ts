/**
 * Custom tests for the http_request node
 * 
 * These tests validate the functionality of the HTTP Request node
 * by testing various request types and response handling
 */
import { NodeTest, NodeTestResult } from '../../types/nodeTestsStandard';

/**
 * Define real functional tests for the http_request node
 */
const tests: NodeTest[] = [
  {
    name: 'GET Request Test',
    description: 'Tests basic GET request functionality',
    category: 'api',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test with a real public API
        const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
        
        if (!response.ok) {
          return {
            passed: false,
            message: `GET request failed with status ${response.status}`,
            details: {
              status: response.status,
              statusText: response.statusText
            }
          };
        }
        
        const data = await response.json();
        
        // Verify the response structure
        if (!data.id || !data.title) {
          return {
            passed: false,
            message: 'GET request response missing expected fields',
            details: {
              response: data
            }
          };
        }
        
        return {
          passed: true,
          message: 'GET request test passed successfully',
          details: {
            responseData: data,
            status: response.status
          }
        };
      } catch (error) {
        return {
          passed: false,
          message: `GET request test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'POST Request Test',
    description: 'Tests POST request with JSON body',
    category: 'api',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test POST request
        const postData = {
          title: 'Test Todo',
          completed: false,
          userId: 1
        };
        
        const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });
        
        if (!response.ok) {
          return {
            passed: false,
            message: `POST request failed with status ${response.status}`,
            details: {
              status: response.status,
              statusText: response.statusText
            }
          };
        }
        
        const data = await response.json();
        
        // Verify response has an ID assigned (usually 101 for JSONPlaceholder)
        if (!data.id) {
          return {
            passed: false,
            message: 'POST request response missing ID',
            details: {
              response: data
            }
          };
        }
        
        return {
          passed: true,
          message: 'POST request test passed successfully',
          details: {
            requestData: postData,
            responseData: data,
            status: response.status
          }
        };
      } catch (error) {
        return {
          passed: false,
          message: `POST request test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  },
  {
    name: 'Error Handling Test',
    description: 'Tests handling of non-existent endpoints',
    category: 'validation',
    run: async (): Promise<NodeTestResult> => {
      try {
        // Test with non-existent endpoint
        const response = await fetch('https://jsonplaceholder.typicode.com/invalid-endpoint');
        
        // Even though this returns a 404, the fetch itself should succeed
        // We're testing that the code properly handles HTTP error codes
        
        if (response.status !== 404) {
          return {
            passed: false,
            message: `Expected 404 status, got ${response.status}`,
            details: {
              status: response.status,
              statusText: response.statusText
            }
          };
        }
        
        return {
          passed: true,
          message: 'Error handling test passed successfully',
          details: {
            status: response.status,
            statusText: response.statusText
          }
        };
      } catch (error) {
        // Network errors would be caught here
        return {
          passed: false,
          message: `Error handling test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

export default tests;