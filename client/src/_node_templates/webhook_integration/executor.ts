/**
 * Webhook Integration Node Executor
 * 
 * This executor handles the registration and management of webhook endpoints,
 * and processes incoming webhook data when the endpoint is triggered.
 */

// Use a more flexible interface for the node executor to allow meta property
interface NodeExecutor<T> {
  (node: { id: string; data: T }, inputs: Record<string, any[]>, context?: any): Promise<Record<string, any[]> | { [key: string]: any[], meta?: any }>;
}

import { WebhookIntegrationData, defaultData } from './definition';

// Re-export the default data for use in UI
export { defaultData };
export type { WebhookIntegrationData };

// Node executor function
export const executor: NodeExecutor<WebhookIntegrationData> = async (node, inputs, context) => {
  try {
    // This is a trigger node, it doesn't process incoming data from other nodes
    // Instead, it's triggered by external webhook calls
    
    // Generate webhook ID if not already set
    const webhookId = node.data.webhookId || `webhook-${node.id}-${Date.now()}`;
    
    // Generate webhook URL using the Integration Engine
    const basePath = context?.serverUrl || '';
    const baseWebhookPath = '/api/webhooks/workflow';
    const webhookUrl = `${basePath}${baseWebhookPath}/${context?.workflowId}/node/${node.id}`;
    
    // Return the webhook details
    // This doesn't actually trigger the flow, it just registers the webhook
    return {
      // These outputs will be used when the webhook is triggered
      output: [],
      
      // Special metadata for the Integration Engine
      meta: {
        webhookId,
        webhookUrl,
        webhookPath: node.data.path,
        webhookMethod: node.data.method,
        requireAuth: node.data.requireAuth,
        authType: node.data.authType,
        isRegistration: true, // Indicates that this is a webhook registration
      }
    };
  } catch (error) {
    // Handle errors
    console.error('Webhook integration execution error:', error);
    throw new Error(`Webhook registration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// When the webhook is triggered by an external call, this handler processes the request
export const webhookHandler = async (request: any, context: any) => {
  try {
    // Extract data from the incoming webhook request
    const { body, headers, query, params } = request;
    
    // Process the webhook data
    const payload = body;
    
    // Return the processed data to be sent to output nodes
    return {
      payload: [{ json: payload }],
      headers: [{ json: headers }],
      params: [{ json: { ...query, ...params } }],
    };
  } catch (error) {
    console.error('Webhook handler error:', error);
    throw new Error(`Webhook handler failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};