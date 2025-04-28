/**
 * Real functional tests for the http_request node
 * 
 * These tests validate actual HTTP request functionality
 */
import { NodeTest, NodeTestResult } from '../../types/nodeTestsStandard';

/**
 * HTTP request utility functions
 */
class HttpRequester {
  /**
   * Makes a GET request to a URL
   */
  static async get(url: string): Promise<any> {
    const startTime = performance.now();
    try {
      const response = await fetch(url);
      const duration = Math.round(performance.now() - startTime);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration
      };
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      throw { error, duration };
    }
  }
  
  /**
   * Makes a POST request to a URL with data
   */
  static async post(url: string, data: any): Promise<any> {
    const startTime = performance.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const duration = Math.round(performance.now() - startTime);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration
      };
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      throw { error, duration };
    }
  }
  
  /**
   * Validates a URL
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Define real functional tests for the http_request node
 */
const tests: NodeTest[] = [
  {
    name: 'GET Request',
    description: 'Tests basic GET request to a public API',
    category: 'http',
    run: async (): Promise<NodeTestResult> => {
      try {
        const testUrl = 'https://jsonplaceholder.typicode.com/todos/1';
        
        // Perform the actual GET request
        const result = await HttpRequester.get(testUrl);
        
        // Verify we got a valid response with the expected structure
        if (!result.data || !result.data.id || result.data.id !== 1) {
          return {
            passed: false,
            message: 'GET request test failed: Response missing expected data structure',
            details: {
              url: testUrl,
              response: result.data,
              status: result.status,
              executionTime: result.duration
            }
          };
        }
        
        // Test passed
        return {
          passed: true,
          message: 'GET request test passed successfully',
          details: {
            url: testUrl,
            response: result.data,
            status: result.status,
            executionTime: result.duration
          }
        };
      } catch (error: any) {
        return {
          passed: false,
          message: `GET request test failed: ${error.error instanceof Error ? error.error.message : String(error.error)}`,
          details: {
            executionTime: error.duration
          }
        };
      }
    }
  },
  {
    name: 'POST Request',
    description: 'Tests POST request with JSON payload',
    category: 'http',
    run: async (): Promise<NodeTestResult> => {
      try {
        const testUrl = 'https://jsonplaceholder.typicode.com/posts';
        const testData = {
          title: 'Test Post',
          body: 'This is a test post',
          userId: 1
        };
        
        // Perform the actual POST request
        const result = await HttpRequester.post(testUrl, testData);
        
        // Verify we got a valid response with the expected structure
        if (!result.data || !result.data.id || !result.data.title || result.data.title !== testData.title) {
          return {
            passed: false,
            message: 'POST request test failed: Response missing expected data',
            details: {
              url: testUrl,
              requestData: testData,
              response: result.data,
              status: result.status,
              executionTime: result.duration
            }
          };
        }
        
        // Test passed
        return {
          passed: true,
          message: 'POST request test passed successfully',
          details: {
            url: testUrl,
            requestData: testData,
            response: result.data,
            status: result.status,
            executionTime: result.duration
          }
        };
      } catch (error: any) {
        return {
          passed: false,
          message: `POST request test failed: ${error.error instanceof Error ? error.error.message : String(error.error)}`,
          details: {
            executionTime: error.duration
          }
        };
      }
    }
  },
  {
    name: 'URL Validation',
    description: 'Tests URL validation functionality',
    category: 'validation',
    run: async (): Promise<NodeTestResult> => {
      try {
        const startTime = performance.now();
        
        // Test cases
        const validUrl = 'https://jsonplaceholder.typicode.com/posts';
        const invalidUrl = 'not-a-valid-url';
        
        // Test valid URL
        const validUrlResult = HttpRequester.validateUrl(validUrl);
        
        // Test invalid URL
        const invalidUrlResult = HttpRequester.validateUrl(invalidUrl);
        
        const duration = Math.round(performance.now() - startTime);
        
        // Verify results
        if (validUrlResult !== true || invalidUrlResult !== false) {
          return {
            passed: false,
            message: 'URL validation test failed: unexpected validation results',
            details: {
              validUrl,
              validUrlResult,
              invalidUrl,
              invalidUrlResult,
              executionTime: duration
            }
          };
        }
        
        // Test passed
        return {
          passed: true,
          message: 'URL validation test passed successfully',
          details: {
            validUrl,
            validUrlResult,
            invalidUrl,
            invalidUrlResult,
            executionTime: duration
          }
        };
      } catch (error) {
        return {
          passed: false,
          message: `URL validation test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

export default tests;