/**
 * Webhook Server
 * 
 * This is a simplified standalone server that only handles webhook requests
 * in the most direct way possible, eliminating complex middleware or routing.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { handleWebhookRequest, handleWebhookResponse } from './webhooks/webhookController';
import { getWebhookStats } from './webhooks/webhookHandler';
import { storage } from '../server/storage';
import { log } from '../server/vite';

/**
 * Start a standalone webhook server
 */
export function startWebhookServer() {
  // Create a new Express app dedicated to webhook handling
  const app = express();
  const port = process.env.INTEGRATION_ENGINE_PORT || 3001;
  
  // Configure middleware - keep it minimal
  app.use(cors());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Webhook Server] ${req.method} ${req.path}`);
    log(`[Webhook Server] ${req.method} ${req.path}`, 'webhook-server');
    next();
  });
  
  // Health check endpoint - most basic route for testing
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'webhook-server' });
  });
  
  // === DIRECT WEBHOOK ROUTES ===
  // Order of routes is crucial - most specific routes must come first
  
  // Webhook with specific workflow and node
  app.all('/webhooks/workflow/:workflowId/node/:nodeId', (req: Request, res: Response) => {
    console.log(`Processing direct webhook for workflow ${req.params.workflowId}, node ${req.params.nodeId}`);
    return handleWebhookRequest(req, res);
  });
  
  // Webhook with custom path
  app.all('/webhooks/:path', async (req: Request, res: Response) => {
    try {
      const customPath = req.params.path;
      
      // Guard against conflicts with other routes
      if (customPath === 'workflow') {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook path. Use /webhooks/workflow/:workflowId/node/:nodeId for workflow targeting'
        });
      }
      
      console.log(`Processing webhook with custom path: ${customPath}`);
      
      // Find a workflow with matching webhook path
      let targetWorkflow;
      let targetNodeId;
      
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
      
      if (!targetWorkflow || !targetNodeId) {
        return res.status(404).json({
          success: false,
          message: `No workflow found with webhook path: ${customPath}`
        });
      }
      
      // Add workflow and node info to request params
      req.params.workflowId = String(targetWorkflow.id);
      req.params.nodeId = targetNodeId;
      
      // Forward to webhook handler
      console.log(`Found workflow ${targetWorkflow.id} for path ${customPath}`);
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
  
  // === WEBHOOK API ENDPOINTS ===
  
  // API for responding to a webhook
  app.post('/api/webhook-response', handleWebhookResponse);
  
  // API for getting webhook status information
  app.get('/api/webhook-stats', (req: Request, res: Response) => {
    res.json({
      success: true,
      ...getWebhookStats()
    });
  });
  
  // API documentation
  app.get('/api/webhooks', (req: Request, res: Response) => {
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
  
  // Debug endpoint to list registered routes
  app.get('/debug/routes', (req: Request, res: Response) => {
    const routes: { path: string; methods: string[] }[] = [];
    
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        const path = middleware.route.path;
        const methods = Object.keys(middleware.route.methods)
          .filter((method: string) => middleware.route.methods[method])
          .map((method: string) => method.toUpperCase());
        routes.push({ path, methods });
      }
    });
    
    routes.sort((a, b) => a.path.localeCompare(b.path));
    res.json({ success: true, routes });
  });
  
  // Start the server and return it
  const server = app.listen(port, () => {
    console.log(`[Webhook Server] running on port ${port}`);
    log(`[Webhook Server] running on port ${port}`, 'webhook-server');
    
    // Print registered routes for debugging
    console.log('\n=== REGISTERED WEBHOOK ROUTES ===');
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        const path = middleware.route.path;
        const methods = Object.keys(middleware.route.methods)
          .filter((method: string) => middleware.route.methods[method])
          .map((method: string) => method.toUpperCase())
          .join(',');
        console.log(`${methods}\t${path}`);
      }
    });
    console.log('=== END WEBHOOK ROUTES ===\n');
  });
  
  return server;
}

/**
 * For testing purposes
 */
export function createWebhookApp() {
  const app = express();
  
  app.use(cors());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
  
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'webhook-server' });
  });
  
  app.all('/webhooks/workflow/:workflowId/node/:nodeId', (req: Request, res: Response) => {
    return handleWebhookRequest(req, res);
  });
  
  app.post('/api/webhook-response', handleWebhookResponse);
  
  return app;
}