/**
 * Simple Webhook Server
 * 
 * A minimal implementation that focuses exclusively on webhook functionality.
 * This server handles incoming webhook requests and forwards them to the workflow execution engine.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { storage } from '../server/storage';

const WORKFLOW_EXECUTION_URL = process.env.WORKFLOW_EXECUTION_URL || 'http://localhost:3002';
const PORT = process.env.INTEGRATION_ENGINE_PORT || 3001;

// Create a simple Express server
const app = express();

// Configure middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`[Simple Webhook Server] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'simple-webhook-server' });
});

// Webhook documentation endpoint
app.get('/api/webhooks', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook API documentation',
    endpoints: {
      direct_webhook: {
        url: '/webhooks/workflow/:workflowId/node/:nodeId',
        method: 'Any',
        description: 'Send a webhook directly to a specific workflow node'
      },
      custom_path: {
        url: '/webhooks/:path',
        method: 'Any', 
        description: 'Send a webhook to a workflow with a custom path'
      }
    }
  });
});

// Main webhook handler for direct workflow/node targeting
app.all('/webhooks/workflow/:workflowId/node/:nodeId', async (req, res) => {
  try {
    const workflowId = req.params.workflowId;
    const nodeId = req.params.nodeId;
    
    console.log(`Processing webhook for workflow ${workflowId}, node ${nodeId}`);
    
    // Create webhook data
    const webhookId = uuidv4();
    const webhookData = {
      id: webhookId,
      workflowId: workflowId,
      nodeId: nodeId,
      timestamp: Date.now(),
      method: req.method,
      path: req.path,
      headers: sanitizeHeaders(req.headers),
      query: sanitizeQuery(req.query),
      body: req.body,
      respondDirectly: true
    };
    
    // Forward to workflow execution
    const response = await fetch(`${WORKFLOW_EXECUTION_URL}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error forwarding webhook: ${response.status} ${errorText}`);
      
      res.status(response.status).json({
        success: false,
        error: `Workflow execution error: ${response.status}`,
        message: errorText
      });
      return;
    }
    
    // Forward the workflow execution response back to the client
    const responseBody = await response.json();
    
    res.status(responseBody.statusCode || 200).json(responseBody.body || {
      success: true,
      message: 'Webhook processed successfully',
      webhookId: webhookId
    });
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Webhook handler for custom paths
app.all('/webhooks/:path', async (req, res) => {
  try {
    const customPath = req.params.path;
    
    // Prevent route conflicts
    if (customPath === 'workflow') {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook path. Use /webhooks/workflow/:workflowId/node/:nodeId for direct targeting.'
      });
    }
    
    console.log(`Processing webhook with custom path: ${customPath}`);
    
    // Find the target workflow and node
    let targetWorkflow;
    let targetNodeId;
    
    try {
      const workflows = await storage.getWorkflows();
      
      for (const workflow of workflows) {
        if (!workflow.flowData) continue;
        
        // Parse flow data if needed
        const flowData = typeof workflow.flowData === 'string' 
          ? JSON.parse(workflow.flowData) 
          : workflow.flowData;
        
        // Find webhook nodes with matching path
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
      }
    } catch (e) {
      console.error('Error finding workflow:', e);
    }
    
    if (!targetWorkflow || !targetNodeId) {
      return res.status(404).json({
        success: false,
        message: `No workflow found with webhook path: ${customPath}`
      });
    }
    
    // Create webhook data
    const webhookId = uuidv4();
    const webhookData = {
      id: webhookId,
      workflowId: targetWorkflow.id,
      nodeId: targetNodeId,
      timestamp: Date.now(),
      method: req.method,
      path: req.path,
      headers: sanitizeHeaders(req.headers),
      query: sanitizeQuery(req.query),
      body: req.body,
      respondDirectly: true
    };
    
    console.log(`Forwarding webhook to workflow ${targetWorkflow.id}, node ${targetNodeId}`);
    
    // Forward to workflow execution
    const response = await fetch(`${WORKFLOW_EXECUTION_URL}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error forwarding webhook: ${response.status} ${errorText}`);
      
      res.status(response.status).json({
        success: false,
        error: `Workflow execution error: ${response.status}`,
        message: errorText
      });
      return;
    }
    
    // Forward the workflow execution response
    const responseBody = await response.json();
    
    res.status(responseBody.statusCode || 200).json(responseBody.body || {
      success: true,
      message: 'Webhook processed successfully',
      webhookId
    });
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Debug route to see all registered routes
app.get('/debug/routes', (req, res) => {
  const routes: Array<{ path: string, methods: string[] }> = [];
  
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());
      routes.push({ path, methods });
    }
  });
  
  routes.sort((a, b) => a.path.localeCompare(b.path));
  res.json({ routes });
});

// Helper functions
function sanitizeHeaders(headers: any): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  Object.keys(headers).forEach(key => {
    // Skip certain headers
    if (['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      return;
    }
    
    const value = headers[key];
    if (value !== undefined) {
      sanitized[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }
  });
  
  return sanitized;
}

function sanitizeQuery(query: any): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  Object.keys(query).forEach(key => {
    const value = query[key];
    if (value !== undefined) {
      sanitized[key] = Array.isArray(value) ? value.join(',') : String(value);
    }
  });
  
  return sanitized;
}

// Start the server
if (import.meta.url.endsWith(process.argv[1])) {
  app.listen(PORT, () => {
    console.log(`Simple Webhook Server running on port ${PORT}`);
    
    // Print registered routes
    console.log('\n=== REGISTERED ROUTES ===');
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        const path = middleware.route.path;
        const methods = Object.keys(middleware.route.methods)
          .filter(method => middleware.route.methods[method])
          .map(method => method.toUpperCase())
          .join(',');
        console.log(`${methods}\t${path}`);
      }
    });
    console.log('=== END ROUTES ===\n');
  });
}

// Export the app for testing
export default app;

// Export a function to start the server
export function startSimpleWebhookServer() {
  return app.listen(PORT, () => {
    console.log(`Simple Webhook Server running on port ${PORT}`);
  });
}