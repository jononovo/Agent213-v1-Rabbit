/**
 * Webhook Controller for Integration Engine
 * 
 * This module handles incoming webhook requests, forwarding them to the workflow execution
 * server, and handling responses from webhook nodes.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { WebhookRequest, WebhookResponse } from '../../shared/types/webhook';
import * as webhookHandler from './webhookHandler';
import logger from '../logging';

/**
 * Process a webhook request
 * This function is the main entry point for webhook processing
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function handleWebhookRequest(req: Request, res: Response): Promise<void> {
  try {
    logger.info(`Processing webhook request for path: ${req.path}`);
    
    // Extract workflow and node IDs from request parameters
    const workflowId = req.params.workflowId;
    const nodeId = req.params.nodeId;
    
    // Log the detailed request for debugging and tracking
    const requestInfo = logger.webhook.request(req, {
      workflowId,
      nodeId,
      requestId: `webhook_${Date.now()}`
    });
    
    if (!workflowId || !nodeId) {
      logger.error('Missing required parameters workflowId or nodeId');
      res.status(400).json({
        success: false,
        message: 'Missing required parameters workflowId or nodeId'
      });
      return;
    }
    
    logger.info(`Webhook request for workflow ${workflowId}, node ${nodeId}`);
    
    // Create a sanitized copy of headers (remove content-length, etc. if present)
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      // Skip content-length as it will be recalculated
      if (key.toLowerCase() === 'content-length') continue;
      
      // Skip connection, host, etc.
      if (['connection', 'host', 'accept-encoding', 'user-agent'].includes(key.toLowerCase())) continue;
      
      // Convert header value to string
      if (value !== undefined) {
        sanitizedHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }
    
    // Create normalized query parameters
    const sanitizedQuery: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (value !== undefined) {
        sanitizedQuery[key] = Array.isArray(value) ? value.join(',') : String(value);
      }
    }
    
    // Create webhook request data
    const webhookData: WebhookRequest = webhookHandler.createWebhookRequest(
      workflowId,
      nodeId,
      req.method,
      sanitizedHeaders,
      sanitizedQuery,
      req.body,
      req.path,
      { respondDirectly: true }
    );
    
    // Log basic info about the webhook request
    logger.info(`Created webhook request ${webhookData.id} for workflow ${workflowId}, node ${nodeId}`);
    
    // Forward to workflow execution service
    await webhookHandler.forwardWebhookToWorkflowExecution(webhookData);
    
    // Check if a response is immediately available
    if (webhookHandler.hasWebhookResponse(webhookData.id)) {
      const response = webhookHandler.getWebhookResponse(webhookData.id);
      
      if (response) {
        // Send response to client
        logger.info(`Sending immediate webhook response for ${webhookData.id}, status: ${response.statusCode}`);
        
        // Log the response details
        logger.webhook.response(webhookData.id, {
          statusCode: response.statusCode,
          headers: response.headers,
          body: response.body
        });
        
        // Set status code and headers
        res.status(response.statusCode);
        Object.entries(response.headers).forEach(([key, value]) => {
          res.set(key, value);
        });
        
        // Send body
        res.send(response.body);
        
        // Clean up the response from memory
        webhookHandler.cleanupWebhookResponse(webhookData.id);
      } else {
        // This should not happen but handle it anyway
        logger.error(`Response marked as ready but not found for webhook ${webhookData.id}`);
        res.status(500).json({
          success: false,
          message: 'Webhook response not found',
          webhookId: webhookData.id
        });
      }
    } else {
      // No immediate response, send pending status
      logger.info(`No immediate response available for webhook ${webhookData.id}`);
      
      // Webhook is pending response from the workflow
      res.status(202).json({
        success: true,
        message: 'Webhook request accepted for processing',
        webhookId: webhookData.id,
        status: 'pending'
      });
    }
  } catch (error) {
    logger.error('Error processing webhook request:', error);
    
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
    const { webhookId, statusCode, headers, body, success, error } = req.body;
    
    if (!webhookId) {
      res.status(400).json({
        success: false,
        message: 'Missing required parameter webhookId'
      });
      return;
    }
    
    logger.info(`Received webhook response for ${webhookId}, status: ${statusCode || 200}`);
    
    // Log the response details
    logger.webhook.response(webhookId, {
      statusCode: statusCode || 200,
      headers: headers || { 'Content-Type': 'application/json' },
      body: body || { success: true }
    });
    
    // Create and store response
    await webhookHandler.createWebhookResponse(
      webhookId,
      statusCode || 200,
      headers || { 'Content-Type': 'application/json' },
      body || { success: true },
      success !== undefined ? success : true,
      error
    );
    
    res.json({
      success: true,
      message: 'Webhook response stored successfully',
      webhookId
    });
  } catch (error) {
    logger.error('Error processing webhook response:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error processing webhook response',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Function to clean up webhook response resources
 */
export function cleanupWebhookResponse(webhookId: string): void {
  webhookHandler.cleanupWebhookResponse(webhookId);
}