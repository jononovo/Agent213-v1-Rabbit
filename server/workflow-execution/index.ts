/**
 * Workflow Execution Server
 * 
 * This is a separate Express server dedicated to handling workflow execution.
 * It provides endpoints for queuing workflows, checking execution status,
 * and now directly handling webhook responses.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { workflowQueue } from './simpleQueue';
import { executeWorkflow } from './workflowEngine';
import { v4 as uuidv4 } from 'uuid';

// Create the express app
const app = express();
const PORT = process.env.WORKFLOW_PORT || 3002;

// Store pending HTTP responses for webhook processing
// This allows the Workflow Execution Server to directly respond to webhook requests
const pendingResponses = new Map<string, {
  res: Response;
  timeout: NodeJS.Timeout;
  workflowId: number;
}>();

// Set up middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[Workflow Execution] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'workflow-execution' });
});

// Create router for API routes
const router = express.Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'workflow-execution' });
});

/**
 * Execute webhook workflow endpoint that can hold the HTTP response
 * 
 * This endpoint executes a workflow triggered by a webhook and can
 * directly respond to the original webhook caller when a send_to_webhook
 * node with respondToOriginal=true is encountered.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { workflowId, originalRequest, startNodeId } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: 'Workflow ID is required'
      });
    }
    
    // Generate request ID for tracking
    const requestId = uuidv4();
    
    // Extract webhook data from the original request
    const webhookData = {
      payload: req.body.payload || {},
      headers: req.body.headers || {},
      method: req.body.method || 'POST',
      query: req.body.query || {},
      params: req.body.params || {},
      path: req.body.path || '',
      // Add metadata for webhook response handling
      requestId,
      isWebhookRequest: true
    };
    
    console.log(`[Workflow Execution] Webhook request received (ID: ${requestId}) for workflow ${workflowId}`);
    
    // Store the response object for later use
    // Set timeout to automatically respond if no webhook node explicitly responds
    const timeout = setTimeout(() => {
      if (pendingResponses.has(requestId)) {
        const { res } = pendingResponses.get(requestId)!;
        
        if (!res.headersSent) {
          res.status(202).json({
            success: true,
            message: "Webhook received and processing started, but no explicit response was sent",
            requestId
          });
        }
        
        pendingResponses.delete(requestId);
        console.log(`[Workflow Execution] Auto-response sent for webhook ${requestId} (timeout reached)`);
      }
    }, 10000); // 10 second timeout
    
    // Store the response object
    pendingResponses.set(requestId, { 
      res, 
      timeout,
      workflowId 
    });
    
    // Add job to the queue with the requestId
    const jobId = await workflowQueue.addJob('execute-workflow', {
      workflowId,
      input: webhookData,
      startNodeId,
      executionMode: "webhook",
      metaData: {
        requestId,
        isWebhook: true
      }
    });
    
    console.log(`[Workflow Execution] Webhook workflow queued with job ID: ${jobId}`);
    
    // Note: We don't send a response here - it will be sent either by a webhook node
    // or by the timeout handler above
  } catch (error) {
    console.error('[Workflow Execution] Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Send a response to a pending webhook request
 * This is called by send_to_webhook nodes to respond to the original webhook
 */
router.post('/webhook-response', async (req: Request, res: Response) => {
  try {
    const { requestId, data, statusCode = 200 } = req.body;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }
    
    // Look up the pending response
    const pendingResponse = pendingResponses.get(requestId);
    
    if (!pendingResponse) {
      return res.status(404).json({
        success: false,
        error: 'No pending response found for this request ID'
      });
    }
    
    // Clear the timeout
    clearTimeout(pendingResponse.timeout);
    
    // Send the response to the original webhook caller
    if (!pendingResponse.res.headersSent) {
      pendingResponse.res.status(statusCode).json(data);
      console.log(`[Workflow Execution] Webhook response sent for request ${requestId}`);
    } else {
      console.log(`[Workflow Execution] Response already sent for request ${requestId}`);
    }
    
    // Clean up
    pendingResponses.delete(requestId);
    
    // Respond to the webhook node
    res.json({
      success: true,
      message: 'Webhook response sent successfully'
    });
  } catch (error) {
    console.error('[Workflow Execution] Error sending webhook response:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get stats about pending webhook responses
router.get('/webhook-stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    pendingCount: pendingResponses.size,
    pendingIds: Array.from(pendingResponses.keys()),
    workflowIds: Array.from(pendingResponses.values()).map(pr => pr.workflowId)
  });
});

// Standard execute workflow endpoint (for non-webhook workflows)
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId, input, nodeId } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: 'Workflow ID is required'
      });
    }
    
    // Add job to the queue
    const jobId = await workflowQueue.addJob('execute-workflow', {
      workflowId,
      input: input || {},
      startNodeId: nodeId
    });
    
    res.json({
      success: true,
      jobId,
      message: 'Workflow execution queued'
    });
  } catch (error) {
    console.error('[Workflow Execution] Error queuing workflow:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get job status endpoint
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await workflowQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    // Return job status
    res.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        result: job.result,
        error: job.error
      }
    });
  } catch (error) {
    console.error('[Workflow Execution] Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Mount router
app.use('/api', router);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Workflow Execution] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Create HTTP server
const server = createServer(app);

// Register workflow execution worker
workflowQueue.registerWorker('execute-workflow', executeWorkflow);

// Start the server
export function startWorkflowExecutionServer() {
  server.listen(PORT, () => {
    console.log(`[Workflow Execution] Server running on port ${PORT}`);
  });
  
  return server;
}

// Export server, app, and the pending responses map for testing and integration
export { app, server, pendingResponses };