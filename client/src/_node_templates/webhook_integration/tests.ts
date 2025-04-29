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
      payload: [],
      headers: [],
      params: [],
      meta: {
        webhookId: expect.stringContaining('webhook-'),
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
      
      // Verify results
      expect(result.payload[0].json).toEqual({ test: 'data' });
      expect(result.headers[0].json).toEqual({ 'content-type': 'application/json' });
      expect(result.params[0].json).toEqual({ source: 'test', id: '123' });
      
      return true;
    }
  }
];

export default tests;