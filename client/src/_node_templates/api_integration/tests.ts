/**
 * API Integration Node Tests
 * 
 * This file contains tests for the API integration node.
 */

import { executor } from './executor';
import { definition } from './definition';

// Define basic tests for the API integration node
const tests = [
  {
    name: 'should make a basic GET request with default configuration',
    executor,
    definition,
    input: {},
    expected: {
      response: [
        {
          json: {
            message: 'Success',
            requestDetails: {
              url: 'https://api.example.com',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              body: undefined,
              timeout: 30000,
              retries: 3
            }
          }
        }
      ],
      status: [{ json: 200 }],
      headers: [{ json: { 'content-type': 'application/json' } }],
      error: []
    }
  },
  {
    name: 'should override URL from input',
    executor,
    definition,
    input: {
      url: [{ json: 'https://api.example.org/custom' }]
    },
    expected: {
      response: [
        {
          json: {
            message: 'Success',
            requestDetails: {
              url: 'https://api.example.org/custom',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              body: undefined,
              timeout: 30000,
              retries: 3
            }
          }
        }
      ],
      status: [{ json: 200 }],
      headers: [{ json: { 'content-type': 'application/json' } }],
      error: []
    }
  },
  {
    name: 'should include query parameters',
    executor,
    definition,
    input: {
      params: [{ json: { page: 1, limit: 10, sort: 'desc' } }]
    },
    expected: {
      response: [
        {
          json: {
            message: 'Success',
            requestDetails: {
              url: 'https://api.example.com?page=1&limit=10&sort=desc',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              body: undefined,
              timeout: 30000,
              retries: 3
            }
          }
        }
      ],
      status: [{ json: 200 }],
      headers: [{ json: { 'content-type': 'application/json' } }],
      error: []
    }
  },
  {
    name: 'should merge headers from input with defaults',
    executor,
    definition,
    input: {
      headers: [{ json: { 'Authorization': 'Bearer token123', 'X-Custom': 'value' } }]
    },
    expected: {
      response: [
        {
          json: {
            message: 'Success',
            requestDetails: {
              url: 'https://api.example.com',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer token123',
                'X-Custom': 'value'
              },
              body: undefined,
              timeout: 30000,
              retries: 3
            }
          }
        }
      ],
      status: [{ json: 200 }],
      headers: [{ json: { 'content-type': 'application/json' } }],
      error: []
    }
  }
];

export default tests;