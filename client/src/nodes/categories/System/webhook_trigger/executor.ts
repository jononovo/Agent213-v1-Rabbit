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
    // In test mode, the nodeId might be missing but we can identify it in multiple ways
    
    // First, check if nodeId is directly provided
    let effectiveNodeId = nodeId;
    
    // If not, try to use the id parameter which should be the full instance ID (nodetype-timestamp)
    if (!effectiveNodeId && id) {
      effectiveNodeId = id;
    }
    
    // If still not found and we're in browser context, try to extract from URL
    if (!effectiveNodeId && typeof window !== 'undefined') {
      // For test execution in the node tester UI, the node ID is in the URL path
      const urlMatch = window.location.pathname.match(/\/([^\/]+?-\d+)/);
      if (urlMatch && urlMatch[1]) {
        effectiveNodeId = urlMatch[1];
        console.log('DEBUG: Extracted node ID from URL:', effectiveNodeId);
      }
    }
    
    console.log('DEBUG: Effective IDs:', { workflowId: effectiveWorkflowId, nodeId: effectiveNodeId });
    
    // In test mode, if we don't have a node ID, use the current node instance ID from the execution context
    // This ensures we always have a valid node ID for webhook URLs
    if (!effectiveNodeId && typeof id === 'string') {
      effectiveNodeId = id;
      console.log('DEBUG: Using node instance ID as fallback:', effectiveNodeId);
    }
    
    // Generate a webhook URL for display - always include the node ID for proper routing
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${effectiveWorkflowId}/node/${effectiveNodeId || 'webhook_trigger-' + Date.now()}`;
    
    // Try to register the webhook if we have enough info
    let registrationResult = null;
    if (effectiveWorkflowId) {
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
          nodeId: effectiveNodeId || id || 'webhook_trigger-' + Date.now(),
          description: `Webhook for workflow ${effectiveWorkflowId}`
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
        nodeId: effectiveNodeId || id || 'webhook_trigger-' + Date.now(),
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
          nodeId: effectiveNodeId || id || 'webhook_trigger-' + Date.now(),
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