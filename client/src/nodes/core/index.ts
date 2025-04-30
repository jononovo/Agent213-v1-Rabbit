/**
 * Core Node System
 * 
 * This is the main entry point for the core node system.
 * It exports all the important interfaces, types, and functions
 * that are needed by the rest of the application.
 */

// Export registry functions and types
export * from './registry/nodeRegistry';
export * from './registry/nodeDiscovery';
export * from './registry/nodeValidation';

// Export types
export * from './types/nodeDefinitions';
export * from './types/nodeExecutionTypes';

// Initialize function that sets up the entire node system
export async function initializeNodeSystem(): Promise<void> {
  const { initializeRegistry } = await import('./registry/nodeRegistry');
  await initializeRegistry();
}