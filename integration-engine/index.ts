/**
 * Integration Engine Server
 * 
 * This is the entry point for the Integration Engine server that handles
 * webhooks and third-party API integrations.
 * 
 * Port: 3001
 */

import { startDirectServer } from './direct-server';
import { log } from '../server/vite';

// Set port
const port = process.env.INTEGRATION_ENGINE_PORT || 3001;

// Start server if this is the main module
if (import.meta.url.endsWith(process.argv[1])) {
  try {
    console.log('Starting Integration Engine with Direct Webhook Server...');
    log('Starting Integration Engine with Direct Webhook Server...', 'integration-engine');
    
    const server = startDirectServer();
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing Integration Engine server');
      server.close(() => {
        console.log('Integration Engine server closed');
      });
    });
    
    console.log(`Integration Engine running on port ${port}`);
    log(`Integration Engine running on port ${port}`, 'integration-engine');
  } catch (error) {
    console.error('Failed to start Integration Engine:', error);
    log(`Failed to start Integration Engine: ${error}`, 'integration-engine');
    process.exit(1);
  }
}

// Export the server starter function
export { startDirectServer };