/**
 * Integration Engine Server
 * 
 * This server handles external API integrations, webhooks, and third-party service
 * communication, creating a clean separation of concerns from the main application.
 * 
 * Port: 3001
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { integrationEngine } from './src/integrationEngine';
import { log } from '../server/vite';
import { handleWebhookRequest, handleWebhookResponse } from './webhooks/webhookController';
import { getWebhookStats } from './webhooks/webhookHandler';
import fetch from 'node-fetch';
import { storage } from '../server/storage';

// Create Express app
const app: Express = express();
const port = process.env.INTEGRATION_ENGINE_PORT || 3001;

// Configure middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  log(`[Integration Engine] ${req.method} ${req.path}`, 'integration-engine');
  next();
});

// Create router for API routes
const router = express.Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'integration-engine' });
});

// === Direct Webhook Routes (without /api prefix) ===

// IMPORTANT: Order matters for Express routing!
// The more specific route must come BEFORE the more general route
// or the general route will catch everything

// 1. Handle direct webhook with workflow/node targeting - MUST COME FIRST for proper routing
app.all('/webhooks/workflow/:workflowId/node/:nodeId', (req: Request, res: Response) => {
  console.log(`[Integration Engine] Direct webhook request for workflow ${req.params.workflowId}, node ${req.params.nodeId}`);
  handleWebhookRequest(req, res);
});

// 2. Handle direct webhook at root level with custom path - MUST COME AFTER the more specific route
app.all('/webhooks/:path', async (req: Request, res: Response) => {
  try {
    // Get the custom path from the request
    const customPath = req.params.path;
    
    // Catch requests that should go to the workflow/node endpoint but were caught here
    if (customPath === 'workflow') {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook path. Use /webhooks/workflow/:workflowId/node/:nodeId for direct workflow targeting'
      });
    }
    
    console.log(`[Integration Engine] Direct webhook request received at custom path: ${customPath}`);
    
    // Find a workflow with matching webhook path
    // Query our storage to find matching workflows
    let targetWorkflow;
    let targetNodeId;
    
    try {
      const workflows = await storage.getWorkflows();
      
      for (const workflow of workflows) {
        try {
          if (!workflow.flowData) continue;
          
          // Parse flow data to find webhook nodes
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
          console.error(`[Integration Engine] Error parsing flow data for workflow ${workflow.id}:`, e);
        }
      }
    } catch (error) {
      console.error('[Integration Engine] Error finding workflow for webhook path:', error);
    }
    
    if (!targetWorkflow || !targetNodeId) {
      return res.status(404).json({
        success: false,
        message: `No workflow found with webhook path: ${customPath}`
      });
    }
    
    // Now we have the workflow and node, we can process the webhook
    // We modify the request to include the workflow and node IDs
    req.params.workflowId = String(targetWorkflow.id);
    req.params.nodeId = targetNodeId;
    
    // Forward to our webhook handler
    console.log(`[Integration Engine] Forwarding path webhook to workflow ${req.params.workflowId}, node ${req.params.nodeId}`);
    return handleWebhookRequest(req, res);
  } catch (error) {
    console.error('[Integration Engine] Error processing direct webhook:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// === Webhook API Endpoints ===

// Send response to a pending webhook
router.post('/webhook-response', handleWebhookResponse);

// Get stats about pending webhook responses
router.get('/webhook-stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    ...getWebhookStats()
  });
});

// Webhook documentation endpoint
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

// Default route - forward to integration engine
router.all('*', async (req: Request, res: Response) => {
  try {
    // Get the path from the request
    const path = req.path;
    
    // Try to handle the request with the integration engine
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

// Mount router to /api path
app.use('/api', router);

// Health check at root level
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'integration-engine' });
});

// Log all registered routes for debugging
function printRoutes(app: Express) {
  console.log('\n=== REGISTERED ROUTES ===');
  
  // Direct routes on app
  console.log('Direct routes:');
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());
      routes.push({ path, methods });
    } else if (middleware.name === 'router') {
      // Routes registered on a router
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods)
            .filter(method => handler.route.methods[method])
            .map(method => method.toUpperCase());
          routes.push({ path: '/api' + path, methods }); // Assuming router is mounted at /api
        }
      });
    }
  });
  
  // Sort and print
  routes.sort((a, b) => a.path.localeCompare(b.path));
  routes.forEach(route => {
    console.log(`${route.methods.join(', ')}\t${route.path}`);
  });
  
  console.log('=== END ROUTES ===\n');
}

// Start the server - detect if this is the main module
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  app.listen(port, () => {
    console.log(`Integration Engine Server running on port ${port}`);
    log(`Integration Engine Server running on port ${port}`, 'integration-engine');
    
    // Print registered routes for debugging
    try {
      printRoutes(app);
    } catch (error) {
      console.error('Error printing routes:', error);
    }
  });
} else {
  // For testing or programmatic use
  console.log('Integration Engine Server loaded as module');
}

export default app;