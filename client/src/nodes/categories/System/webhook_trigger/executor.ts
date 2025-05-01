/**
 * DEBUG VERSION - Webhook Trigger Node Executor
 * 
 * This is a heavily simplified version focusing on debugging
 * the executor loading and execution path.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import * as integrationClient from '@/utils/integrationClient';

// Direct execute function - skipping the factory pattern for maximum simplicity
export async function execute(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  console.log('===========================================');
  console.log('DEBUG: Webhook Trigger Node Executor Was Called!');
  console.log('DEBUG: Node Data:', JSON.stringify(nodeData, null, 2));
  console.log('DEBUG: Inputs:', JSON.stringify(inputs, null, 2));
  console.log('===========================================');
  
  const startTime = new Date();
  
  try {
    // Extract basic info
    const { path, workflowId, nodeId } = nodeData;
    
    // Generate a webhook URL for display
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${workflowId}/node/${nodeId}`;
    
    // Try to register the webhook if we have enough info
    let registrationResult = null;
    if (workflowId && nodeId) {
      try {
        console.log('DEBUG: Attempting to register webhook:', webhookPath);
        registrationResult = await integrationClient.registerIntegration({
          nodeType: 'webhook_trigger',
          capabilities: {
            provides: { endpoint: true, webhook: true },
            endpoint: {
              pathTemplate: webhookPath,
              methods: ['POST', 'GET'],
              authTypes: ['none']
            }
          },
          workflowId: Number(workflowId),
          nodeId: nodeId,
          description: `Debug webhook for workflow ${workflowId}`
        });
        console.log('DEBUG: Webhook registration result:', registrationResult);
      } catch (regError) {
        console.error('DEBUG: Webhook registration error:', regError);
      }
    }
    
    // Create a simple response for debugging
    const result = {
      success: true,
      message: "Debug webhook trigger executed successfully",
      timestamp: startTime.toISOString(),
      webhookUrl: integrationClient.getIntegrationUrl(webhookPath),
      registered: !!registrationResult,
      inputDetails: {
        hasInputs: Object.keys(inputs).length > 0,
        inputKeys: Object.keys(inputs)
      }
    };
    
    console.log('DEBUG: Webhook trigger result:', result);
    
    // Return in the expected format
    return {
      items: [
        { 
          json: result,
          text: JSON.stringify(result)
        }
      ],
      meta: {
        startTime,
        endTime: new Date(),
        source: 'webhook_trigger_debug_version'
      }
    };
  } catch (error: any) {
    console.error('DEBUG: Webhook trigger error:', error);
    
    return {
      items: [
        {
          json: { 
            error: true, 
            message: error.message || 'Unknown error in debug webhook trigger',
            stack: error.stack 
          },
          text: `Error: ${error.message || 'Unknown error'}`
        }
      ],
      meta: {
        startTime,
        endTime: new Date(),
        error: true,
        source: 'webhook_trigger_debug_version'
      }
    };
  }
}