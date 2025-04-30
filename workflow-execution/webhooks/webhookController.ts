/**
 * Webhook Controller - DEPRECATED
 * 
 * This module previously handled webhook requests for the Workflow Execution Server.
 * In the new three-server architecture, webhook handling has been moved to the
 * Integration Engine Server, as external communication responsibility belongs there.
 * 
 * This file is maintained for reference only and should be removed in future cleanup.
 * All webhook functionality should be implemented in integration-engine/webhooks instead.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WebhookRequest } from '../../shared/types/workflow';
import { executeWorkflow } from '../engine/workflowEngine';
import { registerPendingResponse } from './webhookHandler';

/**
 * Process a webhook request
 * This function is the main entry point for webhook processing
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function handleWebhookRequest(req: Request, res: Response): Promise<void> {
  try {
    // Parse the webhook request from the body
    const webhookData = req.body as WebhookRequest;
    
    if (!webhookData.workflowId || !webhookData.startNodeId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: workflowId and startNodeId are required'
      });
    }
    
    // Generate a unique request ID if not provided
    const requestId = webhookData.requestId || `webhook-${uuidv4()}`;
    
    console.log(`[Webhook Controller] Processing webhook request ${requestId} for workflow ${webhookData.workflowId}, node ${webhookData.startNodeId}`);
    
    // Register the response for later use
    registerPendingResponse(requestId, res, webhookData.workflowId);
    
    // Prepare the job input
    const input = {
      payload: webhookData.payload,
      headers: webhookData.headers,
      method: webhookData.method,
      query: webhookData.query,
      params: webhookData.params,
      path: webhookData.path,
      requestId
    };
    
    // Execute the workflow (non-blocking)
    // The response will be sent by a node in the workflow or by timeout
    executeWorkflow({
      id: requestId,
      data: {
        workflowId: webhookData.workflowId,
        input,
        startNodeId: webhookData.startNodeId
      },
      options: {
        executionMode: 'webhook',
        debug: true
      },
      createdAt: new Date()
    }).catch(error => {
      console.error(`[Webhook Controller] Error executing workflow for webhook ${requestId}:`, error);
    });
    
    // The response will be sent by the webhook handler when the workflow completes
    // or by timeout if no explicit response is sent
  } catch (error) {
    console.error('[Webhook Controller] Error processing webhook request:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error processing webhook request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}