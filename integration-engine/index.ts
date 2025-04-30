/**
 * Integration Engine Server
 * 
 * This server handles external API integrations, webhooks, and third-party service
 * communication, creating a clean separation of concerns from the main application.
 * 
 * Port: 3001
 */

import { log } from '../server/vite';
import { startWebhookServer } from './webhook-server';

// Set port
const port = process.env.INTEGRATION_ENGINE_PORT || 3001;

// Start the webhook server when this is the main module
if (import.meta.url.endsWith(process.argv[1])) {
  const server = startWebhookServer();
  console.log(`Webhook Server started on port ${port}`);
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing webhook server');
    server.close(() => {
      console.log('Webhook server closed');
    });
  });
} else {
  console.log('Integration Engine loaded as module');
}

// Export the startWebhookServer function for use in the main server
export { startWebhookServer };