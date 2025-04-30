/**
 * Webhook Controller for Integration Engine
 * 
 * This module handles incoming webhook requests, forwarding them to the workflow execution
 * server, and handling responses from webhook nodes.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { WebhookRequest, WebhookExecutionResult } from '../../shared/types/webhook';
import { registerPendingResponse, sendWebhookResponse } from './webhookHandler';

/**
 * Process a webhook request
 * This function is the main entry point for webhook processing
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function handleWebhookRequest(req: Request, res: Response): Promise<void> {
  try {
    // Direct workflow/node webhook (custom path handling is now in the route handler)
    const workflowId = parseInt(req.params.workflowId || req.body.workflowId, 10);
    const nodeId = req.params.nodeId || req.body.startNodeId;
    
    if (isNaN(workflowId) || !nodeId) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: workflowId and nodeId are required'
      });
      return;
    }
    
    // Generate a unique request ID if not provided
    const requestId = req.body.requestId || `webhook-${uuidv4()}`;
    
    console.log(`[Integration Engine] Processing webhook request ${requestId} for workflow ${workflowId}, node ${nodeId}`);
    
    // Register the response for later use
    registerPendingResponse(requestId, res, workflowId);
    
    // Prepare the webhook request
    const webhookData: WebhookRequest = {
      workflowId,
      startNodeId: nodeId,
      payload: req.body.payload || req.body,
      headers: req.headers as Record<string, string | string[] | undefined>,
      method: req.method,
      query: req.query,
      params: req.params,
      path: req.path,
      requestId
    };
    
    // Forward to Workflow Execution Server
    try {
      const executionResponse = await fetch('http://localhost:3002/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflowId,
          input: webhookData,
          nodeId,
          webhookRequestId: requestId
        })
      });
      
      const result = await executionResponse.json();
      console.log(`[Integration Engine] Workflow execution initiated for webhook ${requestId}`);
      
      // If execution failed immediately, send error response
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        sendWebhookResponse(requestId, {
          success: false,
          message: 'Error executing workflow',
          error: (result as any).error || 'Unknown error'
        }, 500);
      }
      
      // Otherwise, response will be sent by webhook node in the workflow
      // or by the timeout handler
    } catch (error) {
      console.error(`[Integration Engine] Error forwarding webhook to execution server:`, error);
      sendWebhookResponse(requestId, {
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  } catch (error) {
    console.error('[Integration Engine] Error processing webhook request:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error processing webhook request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

/**
 * Endpoint for sending a response to a webhook
 * Used by workflow nodes to respond to webhooks
 */
export async function handleWebhookResponse(req: Request, res: Response): Promise<void> {
  try {
    const { requestId, data, statusCode = 200 } = req.body;
    
    if (!requestId) {
      res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
      return;
    }
    
    // Send the response to the original webhook caller
    const sent = sendWebhookResponse(requestId, data, statusCode);
    
    // Respond to the workflow node
    res.json({
      success: sent,
      message: sent ? 'Webhook response sent successfully' : 'No pending response found or response already sent'
    });
  } catch (error) {
    console.error('[Integration Engine] Error sending webhook response:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending webhook response',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}