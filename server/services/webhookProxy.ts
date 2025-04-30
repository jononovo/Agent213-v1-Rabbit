/**
 * Webhook Proxy Service
 * 
 * This service handles forwarding webhook requests to the Workflow Execution Server
 * and allows send_to_webhook nodes to respond to the original webhook requests.
 * 
 * It acts as a communication bridge between the main application server
 * and the isolated Workflow Execution Server.
 */

import fetch from 'node-fetch';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Map to track pending webhook responses
const pendingResponses = new Map<string, Response>();

// Maximum time to wait for a webhook response (ms)
const WEBHOOK_RESPONSE_TIMEOUT = 10000;

/**
 * Forward a webhook request to the Workflow Execution Server
 * and manage the response handling
 */
export async function forwardWebhookToExecutionServer(
  req: Request,
  res: Response, 
  workflowId: number,
  nodeId: string
): Promise<void> {
  const requestId = uuidv4();
  
  console.log(`[Webhook Proxy] Forwarding webhook request to execution server. RequestID: ${requestId}`);
  
  // Store response object for later use
  pendingResponses.set(requestId, res);
  
  // Set up timeout for response handling
  setTimeout(() => {
    if (pendingResponses.has(requestId) && !res.headersSent) {
      console.log(`[Webhook Proxy] Timeout reached for request ${requestId}. Sending timeout response.`);
      res.status(202).json({
        success: true,
        message: "Webhook received and processing started, but execution is taking longer than expected",
        requestId
      });
      pendingResponses.delete(requestId);
    }
  }, WEBHOOK_RESPONSE_TIMEOUT);
  
  try {
    // Forward to execution server
    const executionResponse = await fetch('http://localhost:3002/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowId,
        input: {
          // Include all necessary request data
          payload: req.body,
          query: req.query,
          params: req.params,
          headers: req.headers,
          method: req.method,
          path: req.path,
          // Metadata for webhook response handling
          requestId,
          isWebhookRequest: true
        },
        startNodeId: nodeId,
        executionMode: "webhook"
      })
    });
    
    const result = await executionResponse.json() as {
      success: boolean;
      jobId?: string;
      error?: string;
    };
    
    // Only send a response if it hasn't been sent by a webhook node
    if (pendingResponses.has(requestId) && !res.headersSent) {
      console.log(`[Webhook Proxy] No immediate response handling. Sending acknowledgment for request ${requestId}`);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Webhook received and workflow execution started",
          requestId,
          jobId: result.jobId
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error starting workflow execution",
          error: result.error,
          requestId
        });
      }
      
      pendingResponses.delete(requestId);
    }
  } catch (error) {
    console.error(`[Webhook Proxy] Error forwarding webhook request ${requestId}:`, error);
    
    // Send error response if not already sent
    if (pendingResponses.has(requestId) && !res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Error processing webhook",
        error: error instanceof Error ? error.message : String(error),
        requestId
      });
      
      pendingResponses.delete(requestId);
    }
  }
}

/**
 * Send a response to a pending webhook request
 * This is called by the webhook-response endpoint to forward 
 * responses from the send_to_webhook node
 */
export function sendWebhookResponse(
  requestId: string, 
  data: any,
  statusCode: number = 200
): boolean {
  const res = pendingResponses.get(requestId);
  
  if (res && !res.headersSent) {
    console.log(`[Webhook Proxy] Sending response for request ${requestId}`);
    res.status(statusCode).json(data);
    pendingResponses.delete(requestId);
    return true;
  } else {
    console.log(`[Webhook Proxy] No pending response found for request ${requestId}`);
    return false;
  }
}

/**
 * Get stats about pending webhook responses
 */
export function getWebhookProxyStats(): {
  pendingCount: number;
  pendingIds: string[];
} {
  return {
    pendingCount: pendingResponses.size,
    pendingIds: Array.from(pendingResponses.keys())
  };
}