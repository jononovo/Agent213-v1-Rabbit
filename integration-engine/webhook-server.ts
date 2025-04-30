/**
 * Webhook Server
 * 
 * This is a simplified standalone server that only handles webhook requests
 * in the most direct way possible, eliminating complex middleware or routing.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { handleWebhookRequest, handleWebhookResponse } from './webhooks/webhookController';
import { getWebhookStats } from './webhooks/webhookHandler';
import { storage } from '../server/storage';
import { log } from '../server/vite';

// Create a dedicated webhook server
const app = express();
const port = 3001;

// Basic middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[Webhook Server] ${req.method} ${req.path}`);
  log(`[Webhook Server] ${req.method} ${req.path}`, 'webhook-server');
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webhook-server' });
});

// Routes for direct webhook access
app.all('/webhooks/workflow/:workflowId/node/:nodeId', (req, res) => {
  console.log(`Processing direct webhook for workflow ${req.params.workflowId}, node ${req.params.nodeId}`);
  handleWebhookRequest(req, res);
});

app.all('/webhooks/:path', async (req, res) => {
  try {
    const customPath = req.params.path;
    
    if (customPath === 'workflow') {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook path. Use /webhooks/workflow/:workflowId/node/:nodeId for workflow targeting'
      });
    }
    
    console.log(`Processing webhook with custom path: ${customPath}`);
    
    let targetWorkflow;
    let targetNodeId;
    
    const workflows = await storage.getWorkflows();
    
    for (const workflow of workflows) {
      try {
        if (!workflow.flowData) continue;
        
        const flowData = typeof workflow.flowData === 'string' ? 
          JSON.parse(workflow.flowData) : workflow.flowData;
        
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
    
    req.params.workflowId = String(targetWorkflow.id);
    req.params.nodeId = targetNodeId;
    
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

// API routes
app.post('/api/webhook-response', handleWebhookResponse);

app.get('/api/webhook-stats', (req, res) => {
  res.json({
    success: true,
    ...getWebhookStats()
  });
});

app.get('/api/webhooks', (req, res) => {
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

// Debug route
app.get('/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());
      routes.push({ path, methods });
    }
  });
  
  routes.sort((a, b) => a.path.localeCompare(b.path));
  res.json({ success: true, routes });
});

// Start server function
export function startWebhookServer() {
  return app.listen(port, () => {
    console.log(`Webhook Server running on port ${port}`);
    log(`Webhook Server running on port ${port}`, 'webhook-server');
    
    // Print registered routes
    console.log('\n=== REGISTERED WEBHOOK ROUTES ===');
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        const path = middleware.route.path;
        const methods = Object.keys(middleware.route.methods)
          .filter(method => middleware.route.methods[method])
          .map(method => method.toUpperCase())
          .join(',');
        console.log(`${methods}\t${path}`);
      }
    });
    console.log('=== END WEBHOOK ROUTES ===\n');
  });
}

// Export app for testing
export default app;