/**
 * This module imports a test workflow for webhook testing
 * It is used to set up a default workflow for testing webhook functionality
 */

import { storage } from './storage';
import { log } from './vite';

/**
 * Imports a webhook test workflow if it doesn't already exist
 * This creates a default workflow specifically for testing webhook callbacks
 */
export async function importWebhookTestWorkflow(): Promise<void> {
  try {
    // Check if webhook test workflow already exists
    const workflows = await storage.getWorkflows();
    const existingWorkflow = workflows.find(w => w.name === 'Webhook Test Workflow');
    
    if (existingWorkflow) {
      log('Webhook test workflow already exists, skipping import');
      return;
    }
    
    // Create a new workflow for webhook testing
    const workflow = await storage.createWorkflow({
      name: 'Webhook Test Workflow',
      description: 'A workflow for testing webhook callbacks',
      type: 'webhook',
      status: 'active',
      agentId: null,
      flowData: {
        nodes: [
          {
            id: 'webhook-trigger-1',
            type: 'webhook_trigger',
            position: { x: 100, y: 100 },
            data: {
              name: 'Webhook Trigger',
              settings: {
                path: 'test-webhook',
                method: 'POST'
              }
            }
          },
          {
            id: 'text-output-1',
            type: 'text_output',
            position: { x: 400, y: 100 },
            data: {
              name: 'Text Output',
              text: 'Webhook received!'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'webhook-trigger-1',
            sourceHandle: 'output',
            target: 'text-output-1',
            targetHandle: 'input'
          }
        ]
      },
      icon: null,
      userId: null
    });
    
    log(`Created webhook test workflow with ID ${workflow.id}`);
  } catch (error) {
    log(`Error importing webhook test workflow: ${error}`);
    // Don't throw the error to prevent application startup failure
  }
}