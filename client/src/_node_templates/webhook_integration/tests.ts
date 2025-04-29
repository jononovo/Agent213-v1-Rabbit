/**
 * Webhook Integration Node Tests
 * 
 * This file contains tests for the webhook integration node.
 */

import { executor, webhookHandler } from './executor';
import { definition } from './definition';

// Define basic tests for the webhook node
const tests = [
  {
    name: 'should generate webhook registration metadata',
    executor,
    definition,
    input: {},
    context: {
      workflowId: 123,
      serverUrl: 'https://api.example.com'
    },
    expected: {
      output: [],
      meta: {
        // Don't validate exact webhookId since it's dynamic
        webhookUrl: 'https://api.example.com/api/webhooks/workflow/123/node/test-node',
        webhookPath: '/incoming-webhook',
        webhookMethod: 'POST',
        requireAuth: false,
        authType: undefined,
        isRegistration: true
      }
    }
  },
  {
    name: 'webhook handler should process incoming request data',
    customTest: async () => {
      // Mock request
      const request = {
        body: { test: 'data' },
        headers: { 'content-type': 'application/json' },
        query: { source: 'test' },
        params: { id: '123' }
      };
      
      // Execute handler
      const result = await webhookHandler(request, {});
      
      // Return the actual result for verification
      return {
        actual: result,
        expected: {
          payload: [{ json: { test: 'data' } }],
          headers: [{ json: { 'content-type': 'application/json' } }],
          params: [{ json: { source: 'test', id: '123' } }]
        }
      };
    }
  }
];

export default tests;