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

// === Webhook Endpoints ===

// Handle incoming webhooks with custom paths
router.all('/webhooks/:path', handleWebhookRequest);

// Handle incoming webhooks with direct workflow/node targeting
router.all('/webhooks/workflow/:workflowId/node/:nodeId', handleWebhookRequest);

// Send response to a pending webhook
router.post('/webhook-response', handleWebhookResponse);

// Get stats about pending webhook responses
router.get('/webhook-stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    ...getWebhookStats()
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

// Start the server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Integration Engine Server running on port ${port}`);
    log(`Integration Engine Server running on port ${port}`, 'integration-engine');
  });
} else {
  // For testing or programmatic use
  console.log('Integration Engine Server loaded as module');
}

export default app;