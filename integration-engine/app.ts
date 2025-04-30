/**
 * Integration Engine App
 * 
 * This file exports a properly configured Express application with
 * all the routes and middleware needed for the integration engine.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { integrationEngine } from './src/integrationEngine';
import { log } from '../server/vite';
import { handleWebhookRequest, handleWebhookResponse } from './webhooks/webhookController';
import { getWebhookStats } from './webhooks/webhookHandler';
import { storage } from '../server/storage';

// Create Express app
const app: Express = express();

// Configure middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  log(`[Integration Engine] ${req.method} ${req.path}`, 'integration-engine');
  next();
});

// === Direct Webhook Routes ===

// 1. Direct webhook routes with specific workflow/node targeting
app.all('/webhooks/workflow/:workflowId/node/:nodeId', handleWebhookRequest);

// 2. Direct webhook routes with custom path
app.all('/webhooks/:path', async (req: Request, res: Response) => {
  try {
    // Get the custom path from the request
    const customPath = req.params.path;
    
    // Guard against routing conflicts
    if (customPath === 'workflow') {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook path. Use /webhooks/workflow/:workflowId/node/:nodeId for workflow targeting'
      });
    }
    
    console.log(`[Integration Engine] Webhook received at custom path: ${customPath}`);
    
    // Find a workflow with matching webhook path
    let targetWorkflow;
    let targetNodeId;
    
    try {
      const workflows = await storage.getWorkflows();
      
      for (const workflow of workflows) {
        try {
          if (!workflow.flowData) continue;
          
          // Parse flow data
          const flowData = typeof workflow.flowData === 'string' ? 
            JSON.parse(workflow.flowData) : workflow.flowData;
          
          // Find webhook trigger nodes with matching path
          const nodes = flowData.nodes || [];
          const webhookNodes = nodes.filter((node: any) => 
            node.type === 'webhook_trigger' && 
            node.data?.settings?.path === customPath
          );
          
          if (webhookNodes.length > 0) {
            targetWorkflow = workflow;
            targetNodeId = webhookNodes[0].id;
            break;
          }
        } catch (e) {
          console.error(`Error parsing flow data for workflow ${workflow.id}:`, e);
        }
      }
    } catch (error) {
      console.error('Error finding workflow for webhook path:', error);
    }
    
    if (!targetWorkflow || !targetNodeId) {
      return res.status(404).json({
        success: false,
        message: `No workflow found with webhook path: ${customPath}`
      });
    }
    
    // Modify request with workflow and node info
    req.params.workflowId = String(targetWorkflow.id);
    req.params.nodeId = targetNodeId;
    
    // Forward to webhook handler
    console.log(`[Integration Engine] Found workflow ${targetWorkflow.id} for path ${customPath}`);
    return handleWebhookRequest(req, res);
  } catch (error) {
    console.error('Error processing webhook request:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// === API Routes ===

// Create an API router
const router = express.Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'integration-engine' });
});

// Webhook response endpoint
router.post('/webhook-response', handleWebhookResponse);

// Webhook stats endpoint
router.get('/webhook-stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    ...getWebhookStats()
  });
});

// Webhook documentation endpoint
router.get('/webhooks', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Webhook API endpoints documentation',
    endpoints: {
      custom_path: {
        url: '/webhooks/:path',
        method: 'Any',
        description: 'Send a webhook to a workflow with custom path'
      },
      direct_workflow: {
        url: '/webhooks/workflow/:workflowId/node/:nodeId',
        method: 'Any',
        description: 'Send a webhook directly to a specific workflow node'
      },
      response: {
        url: '/api/webhook-response',
        method: 'POST',
        description: 'Send a response to a pending webhook request'
      },
      stats: {
        url: '/api/webhook-stats',
        method: 'GET',
        description: 'Get statistics about pending webhook responses'
      }
    }
  });
});

// Default route for integration engine
router.all('*', async (req: Request, res: Response) => {
  try {
    // Get the path from the request
    const path = req.path;
    
    // Try to handle with integration engine
    const handled = await integrationEngine.handleRequest(path, req, res);
    
    // If not handled, return 404
    if (!handled && !res.headersSent) {
      res.status(404).json({
        success: false,
        message: 'Integration endpoint not found'
      });
    }
  } catch (error) {
    console.error('Error handling integration request:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// Mount the API router
app.use('/api', router);

// Root health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'integration-engine' });
});

// Export the app
export default app;