/**
 * Integration Engine Server
 * 
 * This is a separate Express server dedicated to handling Integration Engine
 * API requests and workflow execution. It runs alongside the main application
 * server but provides a clean separation of concerns.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { db } from '../db';
// Import routes once it's created
// Temporarily commented out to avoid import errors
// import { integrationRoutes } from './routes';

// Create the express app
const app = express();
const PORT = process.env.INTEGRATION_PORT || 3001;

// Set up middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[Integration Engine] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'integration-engine' });
});

// Register routes
// Temporarily using a simple router until we have the full implementation
const router = express.Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'integration-engine' });
});

// Perplexity API integration endpoint
router.post('/integration/perplexity', async (req: Request, res: Response) => {
  try {
    const { prompt, systemPrompt, model, temperature, maxTokens } = req.body;
    
    // Get API key from environment variable
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Perplexity API key not configured. Please add PERPLEXITY_API_KEY to your environment variables.' 
      });
    }
    
    // Prepare messages array
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Integration-Engine': 'true'
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-sonar-small-128k-online',
        messages,
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 1000
      })
    });
    
    // Handle Perplexity API errors
    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.json();
      return res.status(perplexityResponse.status).json({ 
        error: `Perplexity API error: ${errorData?.error?.message || perplexityResponse.statusText}` 
      });
    }
    
    // Return the response from Perplexity
    const data = await perplexityResponse.json();
    res.json(data);
    
  } catch (error) {
    console.error('[Integration Engine] Perplexity API error:', error);
    res.status(500).json({ 
      error: `Error proxying request to Perplexity: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

// API request proxy endpoint
router.post('/integration/request', async (req: Request, res: Response) => {
  try {
    // Extract request parameters
    const { method, url, headers = {}, body, timeout = 30000 } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!method) {
      return res.status(400).json({ error: 'HTTP method is required' });
    }
    
    console.log(`[Integration Engine] Outgoing ${method} request to ${url}`);
    
    // Add trace headers for debugging
    const requestHeaders = {
      ...headers,
      'X-Integration-Engine': 'true',
      'X-Request-Source': 'lead-gen-rabbit'
    };
    
    // Build fetch options
    const fetchOptions: any = {
      method,
      headers: requestHeaders,
      body: body || undefined,
      timeout: timeout
    };
    
    // Make the external API request
    const response = await fetch(url, fetchOptions);
    
    // Get response data
    let responseData: any;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Build the response object
    const responseObj = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      ok: response.ok
    };
    
    // Return the response
    res.json(responseObj);
    
  } catch (error) {
    console.error('[Integration Engine] API request error:', error);
    res.status(500).json({ 
      error: `Error making API request: ${error instanceof Error ? error.message : String(error)}`,
      ok: false 
    });
  }
});

// Simple webhook handler
router.all('/integration/webhook/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[Integration Engine] Webhook triggered: ${id}`);
    
    // In a real implementation, we would find the associated workflow and run it
    // For now, we'll just log the request and return a success response
    
    res.json({
      success: true,
      message: 'Webhook received',
      webhookId: id,
      data: {
        body: req.body,
        query: req.query,
        method: req.method
      }
    });
  } catch (error) {
    console.error('[Integration Engine] Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

app.use('/api', router);

// Error handling middleware - must be registered after routes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Integration Engine] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Create HTTP server
const server = createServer(app);

// Start the server
export function startIntegrationServer() {
  server.listen(PORT, () => {
    console.log(`[Integration Engine] Server running on port ${PORT}`);
  });
  
  return server;
}

// Export server for testing and integration
export { app, server };