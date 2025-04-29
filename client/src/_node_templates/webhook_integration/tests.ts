/**
 * Webhook Integration Node Template - Tests
 * 
 * This file contains tests for the webhook integration node.
 * These tests ensure the node behaves correctly in different scenarios.
 */

// Import the executor function for testing
import { execute } from './executor';

// Import test utilities if needed
// import { generateUUID } from '@/utils/helpers';

/**
 * Test that the webhook node correctly handles a basic configuration
 */
export async function testBasicWebhook() {
  // CHANGE THIS: Update node type to match your definition.ts
  const nodeType = 'my_webhook_node';
  
  // Create a test node configuration
  const testNodeData = {
    path: 'test-webhook',
    secret: 'test-secret',
    authType: 'none' as const,
    methods: ['POST'],
    nodeId: 'test-node-id',
    workflowId: 999 // Use a mock workflow ID for testing
  };
  
  // Execute the node
  const result = await execute(testNodeData);
  
  // Verify the result structure
  if (!result.items || result.items.length === 0) {
    throw new Error(`${nodeType} test failed: No output items generated`);
  }
  
  // Check that the webhook URL was generated
  const outputData = result.items[0].json;
  if (!outputData.webhookUrl) {
    throw new Error(`${nodeType} test failed: No webhook URL generated`);
  }
  
  // Check that the webhook URL contains the expected path
  if (!outputData.webhookUrl.includes('webhooks/test-webhook')) {
    throw new Error(`${nodeType} test failed: Webhook URL does not contain expected path`);
  }
  
  // Verify the payload structure
  if (!outputData.payload) {
    throw new Error(`${nodeType} test failed: No payload in output`);
  }
  
  console.log(`✅ ${nodeType} basic test passed`);
  return true;
}

/**
 * Test that the webhook node correctly handles input payloads
 */
export async function testWebhookWithInput() {
  // CHANGE THIS: Update node type to match your definition.ts
  const nodeType = 'my_webhook_node';
  
  // Create a test node configuration
  const testNodeData = {
    path: 'test-webhook-input',
    secret: '',
    authType: 'none' as const,
    methods: ['POST', 'GET'],
    nodeId: 'test-node-input-id',
    workflowId: 998 // Use a different mock workflow ID
  };
  
  // Create a mock input payload
  const mockInput = {
    payload: {
      customField: 'test-value',
      items: [1, 2, 3]
    }
  };
  
  // Execute the node with the input
  const result = await execute(testNodeData, mockInput);
  
  // Verify the result structure
  if (!result.items || result.items.length === 0) {
    throw new Error(`${nodeType} input test failed: No output items generated`);
  }
  
  // Check that the input payload was preserved
  const outputData = result.items[0].json;
  if (!outputData.payload || outputData.payload.customField !== 'test-value') {
    throw new Error(`${nodeType} input test failed: Input payload not preserved`);
  }
  
  // Check metadata
  const meta = result.meta;
  if (!meta.additionalMeta || !meta.additionalMeta.webhookUrl) {
    throw new Error(`${nodeType} input test failed: Metadata missing webhookUrl`);
  }
  
  console.log(`✅ ${nodeType} input handling test passed`);
  return true;
}

/**
 * Run all tests for the webhook node
 */
export default async function runAllTests() {
  await testBasicWebhook();
  await testWebhookWithInput();
  
  console.log('All webhook node tests passed!');
  return true;
}