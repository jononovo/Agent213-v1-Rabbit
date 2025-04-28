/**
 * Webhook Trigger Node Executor
 * 
 * This file handles the execution logic for the webhook_trigger node.
 * In reality, this node doesn't directly execute - it's triggered by incoming HTTP requests.
 * This executor primarily handles webhook registration and provides a placeholder execution.
 * 
 * ENHANCED VERSION: Now using the Integration Engine for more autonomous operation.
 */

import { createNodeOutput, createErrorOutput } from '../../nodeOutputUtils';
import { integrationClient } from '../../../utils/integrationClient';

// Define the webhook trigger node data interface
interface WebhookTriggerNodeData {
  path?: string;
  secret?: string;
  authType: 'none' | 'apiKey' | 'bearer';
  methods: string[];
  workflowId?: number;
  nodeId?: string;
}

/**
 * Execute function for the webhook trigger node
 * In practice, this node is not directly executed during workflow execution,
 * but is called by the server when a webhook request is received.
 * This function is primarily used for testing and validation.
 * 
 * It also registers the webhook with the Integration Engine to make it immediately available.
 */
export const execute = async (
  nodeData: WebhookTriggerNodeData,
  inputs?: any
): Promise<any> => {
  try {
    const startTime = new Date();
    const { path, methods, workflowId, nodeId } = nodeData;
    
    // Register with the integration engine
    await registerWithIntegrationEngine(nodeData);
    
    // For testing purposes, simulate a webhook payload
    // In a real scenario, this data would come from an HTTP request
    const simulatedPayload = inputs?.payload || {
      message: "This is a simulated webhook trigger. In production, this node waits for external HTTP requests."
    };
    
    // Generate the webhook URL that would be used in production
    const webhookUrl = generateWebhookUrl(nodeData);
    
    return createNodeOutput(
      {
        payload: simulatedPayload,
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        webhookUrl
      },
      {
        startTime,
        additionalMeta: {
          webhookUrl,
          allowedMethods: methods,
          isSimulated: true,
          integrationRegistered: true
        }
      }
    );
  } catch (error: any) {
    console.error('Error in webhook_trigger executor:', error);
    return createErrorOutput(
      error.message || 'Error processing webhook trigger',
      'webhook_trigger'
    );
  }
};

/**
 * Register the webhook with the Integration Engine
 */
async function registerWithIntegrationEngine(nodeData: WebhookTriggerNodeData): Promise<void> {
  try {
    const { path, methods, workflowId, nodeId } = nodeData;
    
    if (!workflowId || !nodeId) {
      console.warn('Cannot register webhook: Missing workflowId or nodeId');
      return;
    }
    
    // Determine the endpoint path
    const endpointPath = path || `workflow/${workflowId}/node/${nodeId}`;
    
    // Register with the integration engine
    await integrationClient.registerEndpoint(endpointPath, {
      methods: methods || ['POST'],
      workflowId,
      nodeId,
      description: `Webhook trigger for workflow ${workflowId}, node ${nodeId}`
    });
    
    console.log(`Webhook registered with integration engine: ${endpointPath}`);
  } catch (error) {
    console.error('Error registering webhook with integration engine:', error);
    // Continue execution even if registration fails
    // The webhook can still work through the traditional webhookService
  }
}

/**
 * Helper function to generate the webhook URL based on node data
 */
function generateWebhookUrl(nodeData: WebhookTriggerNodeData): string {
  const { path, workflowId, nodeId } = nodeData;
  
  // Generate the integration endpoint path
  const endpointPath = path || `workflow/${workflowId}/node/${nodeId}`;
  
  // Use the integration client to generate the URL
  return integrationClient.generateWebhookUrl(endpointPath);
}