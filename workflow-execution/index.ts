/**
 * Workflow Execution Server
 * 
 * This is a separate Express server dedicated to handling workflow execution.
 * It provides endpoints for queuing workflows, checking execution status,
 * and directly handling webhook responses.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';

// Import components from new structure
import { workflowQueue } from './queue/simpleQueue';
import { executeWorkflow } from './engine/workflowEngine';
import { 
  sendWebhookResponse, 
  getWebhookStats 
} from './webhooks/webhookHandler';
import { handleWebhookRequest } from './webhooks/webhookController';

// Create the express app
const app = express();
const PORT = process.env.WORKFLOW_PORT || 3002;

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
router.post('/webhook', handleWebhookRequest);

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
    
    // Send the response to the original webhook caller
    const sent = sendWebhookResponse(requestId, data, statusCode);
    
    // Respond to the webhook node
    if (sent) {
      res.json({
        success: true,
        message: 'Webhook response sent successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No pending response found for this request ID or response already sent'
      });
    }
  } catch (error) {
    console.error('[Workflow Execution] Error sending webhook response:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get stats about pending webhook responses
router.get('/webhook-stats', (_req: Request, res: Response) => {
  res.json({
    success: true,
    ...getWebhookStats()
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

// Export server and app for testing and integration
export { app, server };