/**
 * Webhook Trigger Node Executor
 * 
 * This file handles the execution logic for the webhook_trigger node.
 * In reality, this node doesn't directly execute - it's triggered by incoming HTTP requests.
 * This executor primarily handles webhook registration and provides a placeholder execution.
 * 
 * ENHANCED VERSION: Now using the Integration Engine for more autonomous operation.
 */

import { createNodeOutput, createErrorOutput } from '@/nodes/nodeOutputUtils';
import * as integrationClient from '@/utils/integrationClient';

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
    
    // Check if this is a test/debug execution or a real webhook trigger
    const isTestExecution = !inputs?.isRealWebhook;
    
    if (isTestExecution) {
      // For testing purposes, provide information about the webhook
      // In the test harness, we now mark this clearly as a webhook node
      // that cannot be directly tested
      
      // Generate the webhook URL that would be used in production
      const webhookUrl = generateWebhookUrl(nodeData);
      
      // Return special test output for webhook trigger nodes
      return createNodeOutput(
        {
          _specialNode: true,
          _nodeType: 'webhook',
          message: "⚠️ Webhook node cannot be directly executed. It requires an incoming HTTP request to trigger.",
          webhookUrl,
          expectedHttpMethods: methods || ['POST'],
          authType: nodeData.authType || 'none'
        },
        {
          startTime,
          additionalMeta: {
            webhookUrl,
            allowedMethods: methods,
            isWebhookNode: true,
            requiresHttpRequest: true
          }
        }
      );
    } else {
      // This is a real webhook invocation with actual payload data
      const webhookPayload = inputs?.payload || {};
      const headers = inputs?.headers || {};
      const method = inputs?.method || 'POST';
      const webhookUrl = generateWebhookUrl(nodeData);
      
      return createNodeOutput(
        {
          payload: webhookPayload,
          headers,
          method,
          webhookUrl
        },
        {
          startTime,
          additionalMeta: {
            webhookUrl,
            isRealInvocation: true
          }
        }
      );
    }
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
async function registerWithIntegrationEngine(nodeData: WebhookTriggerNodeData): Promise<any> {
  try {
    const { path, methods, workflowId, nodeId, authType } = nodeData;
    
    if (!workflowId || !nodeId) {
      console.warn('Cannot register webhook: Missing workflowId or nodeId');
      return null;
    }
    
    // Create a webhook path pattern
    // If custom path is provided, use it; otherwise use workflowId/nodeId
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${workflowId}/node/${nodeId}`;
    
    // Register the integration with the engine
    const registration = await integrationClient.registerIntegration({
      nodeType: 'webhook_trigger',
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
      description: `Webhook trigger for workflow ${workflowId}`
    });
    
    console.log(`Webhook registered with integration engine: ${webhookPath}`);
    return registration;
  } catch (error) {
    console.error('Error registering webhook with integration engine:', error);
    // Continue execution even if registration fails
    // The webhook can still work through the traditional webhookService
    return null;
  }
}

/**
 * Helper function to generate the webhook URL based on node data
 */
function generateWebhookUrl(nodeData: WebhookTriggerNodeData): string {
  const { path, workflowId, nodeId } = nodeData;
  
  // Generate the integration endpoint path
  // Use webhooks/ prefix for consistent path structure
  const endpointPath = path 
    ? `webhooks/${path}` 
    : `webhooks/workflow/${workflowId}/node/${nodeId}`;
  
  // Use the integration client to generate the URL
  return integrationClient.getIntegrationUrl(endpointPath);
}