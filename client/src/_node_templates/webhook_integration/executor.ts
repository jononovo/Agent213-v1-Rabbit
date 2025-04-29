/**
 * Webhook Integration Node Template - Executor
 * 
 * This file handles the execution logic for a webhook integration node.
 * In reality, a webhook node doesn't directly execute - it's triggered by incoming HTTP requests.
 * This executor primarily handles webhook registration and provides testing functionality.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';
import * as integrationClient from '@/utils/integrationClient';

// Define the webhook node data interface
// CUSTOMIZE THIS: Update this interface to match your node's settings
interface WebhookNodeData {
  path?: string;
  secret?: string;
  authType: 'none' | 'apiKey' | 'bearer';
  methods: string[];
  workflowId?: number;
  nodeId?: string;
}

/**
 * Execute function for the webhook node
 * 
 * In practice, this node is not directly executed during workflow execution,
 * but is called by the server when a webhook request is received.
 * This function is primarily used for testing and validation.
 * 
 * It also registers the webhook with the Integration Engine to make it immediately available.
 */
export const execute = async (
  nodeData: WebhookNodeData,
  inputs?: any
): Promise<any> => {
  try {
    const startTime = new Date();
    const { path, methods, workflowId, nodeId } = nodeData;
    
    // Register with the integration engine
    await registerWithIntegrationEngine(nodeData);
    
    // For testing purposes, simulate a webhook payload
    // In a real scenario, this data would come from an HTTP request
    // CUSTOMIZE THIS: You can modify this simulated payload for testing
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
    console.error('Error in webhook executor:', error);
    return createErrorOutput(
      error.message || 'Error processing webhook',
      'webhook_node' // CHANGE THIS to match your node type
    );
  }
};

/**
 * Register the webhook with the Integration Engine
 * This makes the webhook immediately available for external systems to call
 */
async function registerWithIntegrationEngine(nodeData: WebhookNodeData): Promise<any> {
  try {
    const { path, methods, workflowId, nodeId, authType } = nodeData;
    
    if (!workflowId || !nodeId) {
      console.warn('Cannot register webhook: Missing workflowId or nodeId');
      return null;
    }
    
    // Create a webhook path pattern
    // If custom path is provided, use it; otherwise use workflowId/nodeId
    // CUSTOMIZE THIS: You can modify the path pattern to match your requirements
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${workflowId}/node/${nodeId}`;
    
    // Register the integration with the engine
    const registration = await integrationClient.registerIntegration({
      nodeType: 'my_webhook_node', // CHANGE THIS to match your node type in definition.ts
      capabilities: {
        provides: {
          endpoint: true,
          webhook: true
        },
        endpoint: {
          pathTemplate: webhookPath,
          methods: methods || ['POST'],
          authTypes: [authType || 'none']
        }
      },
      workflowId: Number(workflowId),
      nodeId: nodeId,
      description: `Webhook for workflow ${workflowId}`
    });
    
    console.log(`Webhook registered with integration engine: ${webhookPath}`);
    return registration;
  } catch (error) {
    console.error('Error registering webhook with integration engine:', error);
    // Continue execution even if registration fails
    return null;
  }
}

/**
 * Helper function to generate the webhook URL based on node data
 */
function generateWebhookUrl(nodeData: WebhookNodeData): string {
  const { path, workflowId, nodeId } = nodeData;
  
  // Generate the integration endpoint path
  // CUSTOMIZE THIS: You can modify the URL structure to match your requirements
  const endpointPath = path 
    ? `webhooks/${path}` 
    : `webhooks/workflow/${workflowId}/node/${nodeId}`;
  
  // Use the integration client to generate the URL
  return integrationClient.getIntegrationUrl(endpointPath);
}