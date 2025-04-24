/**
 * Import Test Workflow
 * 
 * This script imports the webhook test workflow into the storage system
 */

import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { InsertWorkflow } from '@shared/schema';

/**
 * Import the webhook test workflow
 */
export async function importWebhookTestWorkflow(): Promise<void> {
  try {
    console.log('Importing webhook test workflow...');
    
    // Check if webhook test workflow already exists
    const existingWorkflows = await storage.getWorkflows();
    const existingWorkflow = existingWorkflows.find(w => w.name === 'Webhook Test Workflow');
    
    if (existingWorkflow) {
      console.log('Webhook test workflow already exists, skipping import');
      return;
    }
    
    // Read the test workflow JSON file
    const workflowPath = path.join(__dirname, '../client/src/workflows/webhook_test_workflow.json');
    
    if (!fs.existsSync(workflowPath)) {
      console.error(`Webhook test workflow not found at ${workflowPath}`);
      return;
    }
    
    const workflowJson = fs.readFileSync(workflowPath, 'utf-8');
    const workflowData = JSON.parse(workflowJson);
    
    // Create workflow in storage
    const newWorkflow: InsertWorkflow = {
      name: workflowData.name,
      description: workflowData.description,
      type: 'custom',
      status: 'active',
      agentId: null,
      flowData: JSON.stringify(workflowData)
    };
    
    await storage.createWorkflow(newWorkflow);
    console.log('Successfully imported webhook test workflow');
  } catch (error) {
    console.error('Error importing webhook test workflow:', error);
  }
}