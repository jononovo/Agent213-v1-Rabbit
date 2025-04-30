/**
 * Integration Engine Server
 * 
 * This module serves as the entry point for the Integration Engine server
 * which handles webhooks and third-party API integrations.
 * 
 * Port: 3001
 */

import { startWebhookServer } from './webhook-server';
import { log } from '../server/vite';

// Set port
const port = process.env.INTEGRATION_ENGINE_PORT || 3001;

// Start the webhook server when this module is directly executed
if (import.meta.url.endsWith(process.argv[1])) {
  try {
    const server = startWebhookServer();
    console.log(`[Integration Engine] Started webhook server on port ${port}`);
    log(`[Integration Engine] Started webhook server on port ${port}`, 'integration-engine');
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing webhook server');
      server.close(() => {
        console.log('Webhook server closed');
      });
    });
  } catch (error) {
    console.error('[Integration Engine] Failed to start webhook server:', error);
    log(`[Integration Engine] Failed to start webhook server: ${error}`, 'integration-engine');
    process.exit(1);
  }
}

// Export the webhook server starter function
export { startWebhookServer };