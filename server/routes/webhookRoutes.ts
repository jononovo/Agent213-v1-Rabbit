/**
 * Webhook Routes for Main Server
 * 
 * This module handles routing webhook requests from the main server
 * to the Integration Engine Server.
 */

import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { storage } from '../storage';

const router = Router();

/**
 * Forward webhook requests to Integration Engine Server
 * 
 * @param req Express request object
 * @param res Express response object
 * @param workflowId ID of the workflow to execute
 * @param nodeId ID of the node to start execution from
 */
export async function forwardWebhookToIntegrationEngine(
  req: Request,
  res: Response,
  workflowId: number,
  nodeId: string
): Promise<void> {
  try {
    // Get the workflow to verify it exists
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      console.log(`Webhook error: Workflow ${workflowId} not found`);
      res.status(404).json({ 
        success: false, 
        message: "Webhook target workflow not found" 
      });
      return;
    }
    
    console.log(`Forwarding webhook request to Integration Engine for workflow ${workflowId}, node ${nodeId}`);
    
    // Forward the request directly to the Integration Engine
    try {
      // The Integration Engine will hold the response and handle it
      const integrationResponse = await fetch(`http://localhost:3001/api/webhooks/workflow/${workflowId}/node/${nodeId}`, {
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json'
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      });
      
      // Copy status code
      res.status(integrationResponse.status);
      
      // Copy headers
      integrationResponse.headers.forEach((value, key) => {
        // Skip certain headers to avoid conflicts
        if (!['content-length', 'connection'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      
      // Forward the response
      const responseBody = await integrationResponse.json();
      res.json(responseBody);
    } catch (error) {
      console.error('Error forwarding webhook to integration engine:', error);
      throw error;
    }
  } catch (error) {
    console.error(`Webhook forwarding error:`, error);
    res.status(500).json({ 
      success: false, 
      message: "Error forwarding webhook", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Export router for use in main routes.ts
export default router;