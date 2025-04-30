/**
 * Integration Engine Server
 * 
 * This server handles external API integrations, webhooks, and third-party service
 * communication, creating a clean separation of concerns from the main application.
 * 
 * Port: 3001
 */

import { log } from '../server/vite';
import app from './app';

// Set port
const port = process.env.INTEGRATION_ENGINE_PORT || 3001;

// Log all registered routes for debugging
function printRoutes(app: any) {
  console.log('\n=== REGISTERED ROUTES ===');
  
  // Direct routes on app
  console.log('Direct routes:');
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .map(method => method.toUpperCase());
      routes.push({ path, methods });
    } else if (middleware.name === 'router') {
      // Routes registered on a router
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods)
            .filter(method => handler.route.methods[method])
            .map(method => method.toUpperCase());
          routes.push({ path: '/api' + path, methods }); // Assuming router is mounted at /api
        }
      });
    }
  });
  
  // Sort and print
  routes.sort((a, b) => a.path.localeCompare(b.path));
  routes.forEach(route => {
    console.log(`${route.methods.join(', ')}\t${route.path}`);
  });
  
  console.log('=== END ROUTES ===\n');
}

// Start the server - detect if this is the main module
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  const server = app.listen(port, () => {
    console.log(`Integration Engine Server running on port ${port}`);
    log(`Integration Engine Server running on port ${port}`, 'integration-engine');
    
    // Print registered routes for debugging
    try {
      printRoutes(app);
    } catch (error) {
      console.error('Error printing routes:', error);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
} else {
  // For testing or programmatic use
  console.log('Integration Engine Server loaded as module');
}

export default app;