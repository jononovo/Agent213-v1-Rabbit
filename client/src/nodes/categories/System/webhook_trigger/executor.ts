/**
 * Webhook Trigger Node Executor
 * 
 * This file handles the execution logic for the webhook_trigger node.
 * In reality, this node doesn't directly execute - it's triggered by incoming HTTP requests.
 * This executor primarily handles webhook registration and provides a placeholder execution.
 * 
 * Uses the standardized BaseExecutor pattern - the single unified
 * approach for all node executors in the workflow system.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';
import * as integrationClient from '@/utils/integrationClient';

/**
 * Type definition for webhook trigger node configuration
 */
interface WebhookTriggerNodeData {
  path?: string;
  secret?: string;
  authType: 'none' | 'apiKey' | 'bearer';
  methods: string[];
  workflowId?: number;
  nodeId?: string;
}

/**
 * Process the webhook trigger node logic
 * In practice, this node is not directly executed during workflow execution,
 * but is called by the server when a webhook request is received.
 * This function is primarily used for testing and validation.
 */
async function processNode(
  nodeData: WebhookTriggerNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  const { path, methods, workflowId, nodeId } = nodeData;
  
  // Only register if not in preview mode and IDs are available
  const isPreview = inputs._isPreview?.items?.[0]?.json === true;
  if (workflowId && nodeId && !isPreview) {
    await registerWithIntegrationEngine(nodeData);
  }
  
  // For testing purposes, simulate a webhook payload
  // In a real scenario, this data would come from an HTTP request
  const providedPayload = inputs.payload?.items?.[0]?.json;
  const simulatedPayload = providedPayload || {
    message: "This is a simulated webhook trigger. In production, this node waits for external HTTP requests."
  };
  
  // Generate the webhook URL that would be used in production
  const webhookUrl = generateWebhookUrl(nodeData);
  
  // Return the webhook data - BaseExecutor will handle formatting
  return {
    payload: simulatedPayload,
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    webhookUrl,
    meta: {
      webhookUrl,
      allowedMethods: methods,
      isSimulated: true,
      integrationRegistered: true
    }
  };
}

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

/**
 * Export the standardized execute function
 * 
 * This line is identical across all node executors, ensuring
 * a single unified approach throughout the entire system.
 */
export const execute = createNodeExecutor<WebhookTriggerNodeData>('webhook_trigger', processNode);