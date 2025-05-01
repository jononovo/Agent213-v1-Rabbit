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
    // Extract node data and settings (workflowId might come from configuration)
    const { path, workflowId, nodeId, id, settings = {} } = nodeData;
    
    // During test execution, try to derive workflowId and nodeId if not provided directly
    const effectiveWorkflowId = workflowId || settings.workflowId || 
        (typeof window !== 'undefined' && window.location.pathname.match(/\/workflow-test\/(\d+)/)?.[1]);
    
    // Make sure we have the node ID for test execution
    // The nodeId variable is sometimes missing, but we can get it from the id property
    // which is consistently populated with the unique node instance ID in test mode
    const effectiveNodeId = nodeId || id || 
        (typeof id === 'string' && id.includes('-') ? id : undefined);
    
    console.log('DEBUG: Effective IDs:', { workflowId: effectiveWorkflowId, nodeId: effectiveNodeId });
    
    // Generate a webhook URL for display
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${effectiveWorkflowId}/node/${effectiveNodeId}`;
    
    // Try to register the webhook if we have enough info
    let registrationResult = null;
    if (effectiveWorkflowId && effectiveNodeId) {
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
          workflowId: Number(effectiveWorkflowId),
          nodeId: effectiveNodeId,
          description: `Debug webhook for workflow ${effectiveWorkflowId}`
        });
        console.log('DEBUG: Webhook registration result:', registrationResult);
      } catch (regError) {
        console.error('DEBUG: Webhook registration error:', regError);
      }
    }
    
    // Create a response that looks like a real webhook trigger
    const result = {
      success: true,
      message: "Webhook trigger executed successfully",
      timestamp: startTime.toISOString(),
      webhookUrl: integrationClient.getIntegrationUrl(webhookPath),
      registered: !!registrationResult,
      webhookData: {
        workflowId: effectiveWorkflowId,
        nodeId: effectiveNodeId,
        method: "POST",
        payload: { inputText: nodeData.inputText || "Test webhook payload" }
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
        source: 'webhook_trigger',
        webhookData: {
          nodeId: effectiveNodeId,
          workflowId: effectiveWorkflowId 
        }
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
        source: 'webhook_trigger'
      }
    };
  }
}