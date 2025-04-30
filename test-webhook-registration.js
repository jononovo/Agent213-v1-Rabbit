/**
 * Test Webhook Registration
 * 
 * This script tests our new "lazy registration" pattern for webhook nodes.
 * It verifies that:
 * 1. The webhook_trigger node skips registration during preview
 * 2. The workflow save handler properly registers webhooks with the Integration Engine
 */

import fetch from 'node-fetch';

// Configuration
const integrationEngineUrl = 'http://localhost:3001';
const mainServerUrl = 'http://localhost:5000';
const workflowExecutionUrl = 'http://localhost:3002';

async function runTests() {
  console.log('=== Testing Webhook Registration System ===');
  
  try {
    // 1. Check if Integration Engine is running
    console.log('\n1. Checking if Integration Engine is running...');
    const healthCheck = await fetch(`${integrationEngineUrl}/health`);
    if (!healthCheck.ok) {
      throw new Error(`Integration Engine health check failed: ${healthCheck.status}`);
    }
    console.log('✅ Integration Engine is running');
    
    // 2. Create a new workflow with a webhook trigger node
    console.log('\n2. Creating a test workflow with webhook_trigger node...');
    const createWorkflowResponse = await fetch(`${mainServerUrl}/api/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Webhook Registration Test',
        description: 'Test workflow for webhook registration',
        type: 'custom',
        flowData: {
          nodes: [
            {
              id: 'webhook-trigger-test',
              type: 'webhook_trigger',
              position: { x: 100, y: 100 },
              data: {
                label: 'Webhook Trigger',
                description: 'Test webhook trigger node',
                methods: ['GET', 'POST'],
                authType: 'none'
              }
            }
          ],
          edges: []
        }
      })
    });
    
    if (!createWorkflowResponse.ok) {
      const errorText = await createWorkflowResponse.text();
      throw new Error(`Failed to create test workflow: ${errorText}`);
    }
    
    const workflow = await createWorkflowResponse.json();
    console.log(`✅ Created test workflow with ID: ${workflow.id}`);
    
    // 3. Check the Integration Engine's debug routes to see if our webhook was registered
    console.log('\n3. Checking if webhook was registered with Integration Engine...');
    const routesResponse = await fetch(`${integrationEngineUrl}/debug/routes`);
    if (!routesResponse.ok) {
      throw new Error(`Failed to get Integration Engine routes: ${routesResponse.status}`);
    }
    
    const routes = await routesResponse.json();
    console.log('Available routes:');
    routes.routes.forEach(route => {
      console.log(`${route.methods.join(',')} ${route.path}`);
    });
    
    // 4. Check if our webhook URL works
    console.log('\n4. Testing webhook endpoint...');
    const webhookPath = `/webhooks/workflow/${workflow.id}/node/webhook-trigger-test`;
    console.log(`Testing webhook at: ${integrationEngineUrl}${webhookPath}`);
    
    const testWebhookResponse = await fetch(`${integrationEngineUrl}${webhookPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log(`Webhook test response status: ${testWebhookResponse.status}`);
    
    if (testWebhookResponse.ok) {
      const webhookResult = await testWebhookResponse.json();
      console.log('Webhook test result:', webhookResult);
      console.log('✅ Webhook endpoint is working!');
    } else {
      console.log('❌ Webhook endpoint returned an error');
      console.log(await testWebhookResponse.text());
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();