/**
 * Direct Webhook Server
 * 
 * This is a simple, direct implementation of a webhook server that handles
 * incoming webhook requests and forwards them to the workflow execution server.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { storage } from '../server/storage';

// Create express app
const app = express();
const port = process.env.INTEGRATION_ENGINE_PORT || 3001;
const WORKFLOW_EXECUTION_URL = process.env.WORKFLOW_EXECUTION_URL || 'http://localhost:3002';

// Configure middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[Direct Webhook Server] ${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'direct-webhook-server'
  });
});

// Routes
app.get('/api/webhooks', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook API documentation',
    endpoints: {
      direct: '/webhooks/workflow/:workflowId/node/:nodeId',
      custom: '/webhooks/:path'
    }
  });
});

// Direct webhook endpoint
app.all('/webhooks/workflow/:workflowId/node/:nodeId', async (req, res) => {
  try {
    const workflowId = req.params.workflowId;
    const nodeId = req.params.nodeId;
    
    console.log(`Processing webhook for workflow ${workflowId}, node ${nodeId}`);
    
    // Create webhook request
    const webhookId = uuidv4();
    
    // Sanitize headers
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() === 'content-length') continue;
      if (value !== undefined) {
        sanitizedHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }
    
    // Sanitize query
    const sanitizedQuery: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (value !== undefined) {
        sanitizedQuery[key] = Array.isArray(value) ? value.join(',') : String(value);
      }
    }
    
    // Create webhook data
    const webhookData = {
      id: webhookId,
      workflowId,
      nodeId,
      timestamp: Date.now(),
      method: req.method,
      headers: sanitizedHeaders,
      query: sanitizedQuery,
      body: req.body,
      path: req.path,
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
    
    // Process response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from workflow execution: ${response.status} ${errorText}`);
      res.status(response.status || 500).json({
        success: false,
        message: 'Error processing webhook',
        error: errorText
      });
      return;
    }
    
    // Handle response
    const responseData = await response.json();
    
    res.status(responseData.statusCode || 200);
    
    // Set headers if provided
    if (responseData.headers) {
      Object.entries(responseData.headers).forEach(([key, value]) => {
        res.set(key, value as string);
      });
    }
    
    // Send response body
    if (responseData.body) {
      res.json(responseData.body);
    } else {
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        webhookId
      });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Custom path webhook
app.all('/webhooks/:path', async (req, res) => {
  try {
    const customPath = req.params.path;
    
    if (customPath === 'workflow') {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook path. Use /webhooks/workflow/:workflowId/node/:nodeId for direct workflow targeting.'
      });
    }
    
    console.log(`Processing webhook with custom path: ${customPath}`);
    
    // Find target workflow and node
    let targetWorkflow;
    let targetNodeId;
    
    try {
      const workflows = await storage.getWorkflows();
      
      for (const workflow of workflows) {
        try {
          if (!workflow.flowData) continue;
          
          const flowData = typeof workflow.flowData === 'string' 
            ? JSON.parse(workflow.flowData) 
            : workflow.flowData;
          
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
          console.error(`Error processing workflow ${workflow.id}:`, e);
        }
      }
    } catch (e) {
      console.error('Error finding target workflow:', e);
    }
    
    if (!targetWorkflow || !targetNodeId) {
      return res.status(404).json({
        success: false,
        message: `No workflow found with webhook path: ${customPath}`
      });
    }
    
    // Create webhook request
    const webhookId = uuidv4();
    
    // Sanitize headers
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() === 'content-length') continue;
      if (value !== undefined) {
        sanitizedHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }
    
    // Sanitize query
    const sanitizedQuery: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (value !== undefined) {
        sanitizedQuery[key] = Array.isArray(value) ? value.join(',') : String(value);
      }
    }
    
    // Create webhook data
    const webhookData = {
      id: webhookId,
      workflowId: targetWorkflow.id,
      nodeId: targetNodeId,
      timestamp: Date.now(),
      method: req.method,
      headers: sanitizedHeaders,
      query: sanitizedQuery,
      body: req.body,
      path: req.path,
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
    
    // Process response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from workflow execution: ${response.status} ${errorText}`);
      res.status(response.status || 500).json({
        success: false,
        message: 'Error processing webhook',
        error: errorText
      });
      return;
    }
    
    // Handle response
    const responseData = await response.json();
    
    res.status(responseData.statusCode || 200);
    
    // Set headers if provided
    if (responseData.headers) {
      Object.entries(responseData.headers).forEach(([key, value]) => {
        res.set(key, value as string);
      });
    }
    
    // Send response body
    if (responseData.body) {
      res.json(responseData.body);
    } else {
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        webhookId
      });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Debug route
app.get('/debug/routes', (req, res) => {
  const routes: Array<{path: string, methods: string[]}> = [];
  
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
          .filter(method => middleware.route.methods[method])
          .map(method => method.toUpperCase())
      });
    }
  });
  
  res.json({ routes });
});

// Export function to start the server
export function startDirectServer() {
  const server = app.listen(port, () => {
    console.log(`Direct Webhook Server running on port ${port}`);
    
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
  
  return server;
}

// Start the server if this is the main module
if (import.meta.url.endsWith(process.argv[1])) {
  startDirectServer();
}

// Export the app for testing
export default app;