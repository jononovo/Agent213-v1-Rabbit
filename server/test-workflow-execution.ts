/**
 * Test script for Workflow Execution Server
 * 
 * This script demonstrates the isolated workflow execution capabilities
 * by submitting a workflow job and polling for results.
 */

import fetch from 'node-fetch';
import { storage } from './storage';

async function testWorkflowExecution() {
  try {
    console.log('Testing Workflow Execution Server...');

    // Load a workflow for testing (using the webhook test workflow or any available workflow)
    const workflows = await storage.getWorkflows();
    if (workflows.length === 0) {
      console.error('No workflows found for testing.');
      return;
    }

    // Use the first workflow for testing
    const testWorkflow = workflows[0];
    console.log(`Using workflow for testing: ${testWorkflow.name} (ID: ${testWorkflow.id})`);

    // Prepare test input
    const testInput = {
      message: 'This is a test execution from the isolated workflow execution service',
      timestamp: new Date().toISOString()
    };

    // Submit the workflow for execution
    console.log('Submitting workflow execution request...');
    const executeResponse = await fetch('http://localhost:5000/api/workflow-execution/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflowId: testWorkflow.id,
        input: testInput
      })
    });

    const executeResult = await executeResponse.json();
    
    if (!executeResult.success) {
      throw new Error(`Failed to queue workflow: ${executeResult.error}`);
    }

    const jobId = executeResult.jobId;
    console.log(`Workflow queued successfully with job ID: ${jobId}`);

    // Poll for status until completion or timeout
    console.log('Polling for execution status...');
    const maxAttempts = 20;
    const pollInterval = 1000; // 1 second
    
    let attempts = 0;
    let completed = false;
    let result: any;

    while (!completed && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusResponse = await fetch(`http://localhost:5000/api/workflow-execution/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const statusResult = await statusResponse.json();
      
      if (!statusResult.success) {
        console.error(`Error checking status: ${statusResult.error}`);
        continue;
      }
      
      const job = statusResult.job;
      console.log(`Job status: ${job.status} (attempt ${attempts}/${maxAttempts})`);
      
      if (job.status === 'completed' || job.status === 'failed') {
        completed = true;
        result = job;
      }
    }

    if (!completed) {
      console.error('Workflow execution timed out or exceeded maximum poll attempts');
      return;
    }

    // Display final results
    console.log('\nWorkflow Execution Complete:');
    console.log(`Status: ${result.status}`);
    
    if (result.status === 'completed') {
      console.log('Result:', JSON.stringify(result.result, null, 2));
    } else {
      console.error('Error:', result.error);
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Execute the test
testWorkflowExecution().catch(console.error);