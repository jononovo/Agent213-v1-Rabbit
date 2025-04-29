/**
 * Webhook Trigger Node Executor
 * 
 * This executor registers the node with the Integration Engine 
 * based on its configuration.
 */

import { registerIntegration, getIntegrationUrl } from '@utils/integrationClient';
import { NodeExecutionData } from '@lib/types/workflow';

// Node data structure
interface WebhookTriggerNodeData {
  webhookPath: string;
  description: string;
  methods: string[];
  authType: string;
}

/**
 * Execute the webhook trigger node
 * 
 * This registers the node with the Integration Engine and provides
 * output with information about the registered webhook.
 */
export const execute = async (
  nodeData: WebhookTriggerNodeData,
  inputs?: any,
  context?: any
): Promise<NodeExecutionData> => {
  try {
    // If we're in a workflow run with inputs, pass the webhook data through
    if (inputs?.webhook) {
      console.log('Webhook triggered with data:', inputs.webhook);
      
      return {
        items: [{ json: inputs.webhook }],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      };
    }
    
    // Get node data with defaults
    const {
      webhookPath = `webhook-${Date.now()}`,
      description = 'Webhook endpoint',
      methods = ['POST'],
      authType = 'none'
    } = nodeData;
    
    // Extract workflow and node information from context
    const workflowId = context?.workflowId;
    const nodeId = context?.nodeId;
    
    if (!workflowId || !nodeId) {
      throw new Error('Webhook trigger node requires workflow context');
    }
    
    // Register with integration engine
    const registrationResult = await registerIntegration({
      nodeType: 'webhook_trigger_integration',
      capabilities: {
        provides: {
          endpoint: true,
          webhook: true
        },
        endpoint: {
          pathTemplate: 'webhooks/:path',
          methods
        }
      },
      workflowId,
      nodeId,
      description
    });
    
    // Generate the full webhook URL
    const webhookUrl = getIntegrationUrl(registrationResult.path);
    
    // Return information about the registered webhook
    return {
      items: [{
        json: {
          webhookUrl,
          path: registrationResult.path,
          methods: registrationResult.methods,
          description: registrationResult.description
        }
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date()
      }
    };
  } catch (error) {
    console.error('Error in webhook_trigger executor:', error);
    
    return {
      items: [{
        json: {
          error: error instanceof Error ? error.message : String(error)
        }
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        error: true,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };
  }
};