/**
 * Integration Engine Service
 * 
 * A lightweight service that manages external integrations like webhooks,
 * API endpoints, and other external service connections.
 * 
 * Features:
 * - Persistent registry of endpoints (stored in Replit Database)
 * - Lazy-loading handlers to minimize startup time
 * - Support for multiple integration types
 * - Extensible provider system (for future MCP integration)
 */

import { Request, Response } from 'express';
import { log } from '../vite';
import { storage } from '../storage';

// Define types
export interface EndpointHandler {
  (req: Request, res: Response): Promise<void>;
}

export interface EndpointConfig {
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  description?: string;
  handler: EndpointHandler;
}

export interface StorableEndpointConfig {
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  description?: string;
  type: string; // 'webhook', 'api', etc.
}

export interface IntegrationProvider {
  name: string;
  channels?: string[];
  handleRequest: (path: string, req: Request, res: Response) => Promise<boolean>;
}

/**
 * Integration Engine - Manages external integrations with a persistent registry
 */
export class IntegrationEngine {
  // Store registered endpoints
  private endpoints: Map<string, EndpointConfig> = new Map();
  
  // Store integration providers (for future MCP integration)
  private providers: Map<string, IntegrationProvider> = new Map();
  
  // Track initialization state
  private initialized: boolean = false;
  private initializing: Promise<void> | null = null;
  
  // Singleton pattern
  private static instance: IntegrationEngine;
  
  private constructor() {
    log('Integration Engine created', 'integration');
  }
  
  /**
   * Get the singleton instance
   */
  static getInstance(): IntegrationEngine {
    if (!IntegrationEngine.instance) {
      IntegrationEngine.instance = new IntegrationEngine();
    }
    return IntegrationEngine.instance;
  }
  
  /**
   * Ensure the engine is initialized before use
   * Lazy-loads the registry from storage
   */
  async ensureInitialized(): Promise<void> {
    // Return immediately if already initialized
    if (this.initialized) return;
    
    // If initialization is in progress, wait for it
    if (this.initializing) {
      return this.initializing;
    }
    
    // Start initialization
    this.initializing = this._initialize();
    await this.initializing;
    this.initializing = null;
  }
  
  /**
   * Internal initialization method
   */
  private async _initialize(): Promise<void> {
    try {
      log('Initializing Integration Engine...', 'integration');
      
      // Load endpoints from storage
      const storedRegistry = await storage.getSetting('integration_registry');
      
      if (storedRegistry?.value) {
        // Convert stored JSON to runtime endpoints
        const registryData = storedRegistry.value as Record<string, StorableEndpointConfig>;
        
        // Load each endpoint
        for (const [path, config] of Object.entries(registryData)) {
          const { methods, workflowId, nodeId, description, type } = config;
          
          // Only initialize with metadata, create handler on-demand
          this.endpoints.set(path, {
            methods,
            workflowId,
            nodeId,
            description,
            handler: this.createLazyHandler(type, workflowId, nodeId)
          });
        }
        
        log(`Loaded ${this.endpoints.size} endpoints from registry`, 'integration');
      } else {
        log('No stored integration registry found, starting with empty registry', 'integration');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Integration Engine:', error);
      // Initialize anyway to avoid getting stuck
      this.initialized = true;
    }
  }
  
  /**
   * Create a lazy-loading handler that will be initialized when needed
   * This is public so it can be used by routes.ts
   */
  createLazyHandler(
    type: string, 
    workflowId?: number, 
    nodeId?: string
  ): EndpointHandler {
    return async (req: Request, res: Response) => {
      try {
        if (type === 'webhook' && workflowId && nodeId) {
          // Import dynamically to avoid circular dependencies
          const { runWorkflow } = await import('../routes');
          
          // Prepare the webhook input
          const webhookInput = {
            payload: req.body,
            headers: req.headers,
            method: req.method,
            query: req.query,
            params: req.params,
            nodeId: nodeId,
            requestId: this.generateRequestId(),
            responseContext: {
              isWebhookResponse: true,
              originalWebhookRequest: {
                path: req.path,
                method: req.method,
              }
            }
          };
          
          // Run the workflow
          const result = await runWorkflow(workflowId, webhookInput, {
            includeDetail: false,
            executionMode: "webhook",
            debug: true
          });
          
          // Check if the webhook response was handled by a node in the workflow
          if (result.webhookResponseHandled) {
            // Response already sent by node
            return;
          }
          
          // Send standard response
          res.json({
            success: true,
            message: "Webhook received and workflow executed",
            result: result.output
          });
        } else {
          // Handle other integration types here in the future
          res.status(501).json({
            success: false,
            message: `Integration type '${type}' not implemented yet`
          });
        }
      } catch (error) {
        console.error(`Error handling ${type} integration:`, error);
        
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: `Error processing ${type} request`,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    };
  }
  
  /**
   * Save the registry to storage
   */
  private async saveRegistry(): Promise<void> {
    try {
      // Convert endpoints to storable format (exclude handlers)
      const registryData: Record<string, StorableEndpointConfig> = {};
      
      // Using Object.keys with direct Map access to avoid TypeScript downlevelIteration issues
      const keys = Array.from(this.endpoints.keys());
      for (const path of keys) {
        const config = this.endpoints.get(path)!;
        registryData[path] = {
          methods: config.methods,
          workflowId: config.workflowId,
          nodeId: config.nodeId,
          description: config.description,
          type: config.workflowId && config.nodeId ? 'webhook' : 'custom'
        };
      }
      
      // Save to storage
      await storage.saveSetting({
        id: 'integration_registry',
        value: registryData
      });
      
      log(`Saved integration registry with ${this.endpoints.size} endpoints`, 'integration');
    } catch (error) {
      console.error('Error saving integration registry:', error);
    }
  }
  
  /**
   * Register a new endpoint with the integration engine
   */
  async registerEndpoint(path: string, config: EndpointConfig): Promise<string> {
    await this.ensureInitialized();
    
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Store the endpoint
    this.endpoints.set(normalizedPath, config);
    log(`Registered integration endpoint: ${normalizedPath}`, 'integration');
    
    // Persist to storage
    await this.saveRegistry();
    
    // Return the registered path for confirmation
    return normalizedPath;
  }
  
  /**
   * Unregister an endpoint
   */
  async unregisterEndpoint(path: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    const result = this.endpoints.delete(normalizedPath);
    
    if (result) {
      log(`Unregistered integration endpoint: ${normalizedPath}`, 'integration');
      // Persist changes
      await this.saveRegistry();
    }
    
    return result;
  }
  
  /**
   * Get all registered endpoints
   */
  async getEndpoints(): Promise<{ path: string, config: Omit<EndpointConfig, 'handler'> }[]> {
    await this.ensureInitialized();
    
    const result: { path: string, config: Omit<EndpointConfig, 'handler'> }[] = [];
    
    // Using Array.from(keys) to avoid TypeScript downlevelIteration issues
    const keys = Array.from(this.endpoints.keys());
    for (const path of keys) {
      const config = this.endpoints.get(path)!;
      result.push({
        path,
        config: {
          methods: config.methods,
          workflowId: config.workflowId,
          nodeId: config.nodeId,
          description: config.description
        }
      });
    }
    
    return result;
  }
  
  /**
   * Register an integration provider (for future MCP support)
   */
  async registerProvider(type: string, provider: IntegrationProvider): Promise<void> {
    await this.ensureInitialized();
    
    this.providers.set(type, provider);
    log(`Registered integration provider: ${type}`, 'integration');
  }
  
  /**
   * Handle an incoming request
   * Returns true if handled, false if no matching endpoint
   */
  async handleRequest(path: string, req: Request, res: Response): Promise<boolean> {
    await this.ensureInitialized();
    
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Log incoming request
    log(`Integration request received: ${req.method} ${normalizedPath}`, 'integration');
    
    // Check if we have a direct endpoint match
    if (this.endpoints.has(normalizedPath)) {
      const endpoint = this.endpoints.get(normalizedPath)!;
      
      // Check if method is allowed
      if (!endpoint.methods.includes('*') && !endpoint.methods.includes(req.method)) {
        res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed for this endpoint`
        });
        return true;
      }
      
      try {
        // Execute the handler
        await endpoint.handler(req, res);
        return true;
      } catch (error) {
        console.error(`Error handling integration request for ${normalizedPath}:`, error);
        
        // Only send response if it hasn't been sent already
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error processing integration request',
            error: error instanceof Error ? error.message : String(error)
          });
        }
        return true;
      }
    }
    
    // Try providers (placeholder for MCP integration)
    // Using Array.from(keys) to avoid TypeScript downlevelIteration issues
    const providerTypes = Array.from(this.providers.keys());
    for (const type of providerTypes) {
      try {
        const provider = this.providers.get(type)!;
        const handled = await provider.handleRequest(normalizedPath, req, res);
        if (handled) {
          return true;
        }
      } catch (error) {
        console.error(`Error in provider ${type}:`, error);
      }
    }
    
    // No matching endpoint or provider
    return false;
  }
  
  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * MCP placeholder - for future implementation
   */
  mcpPlaceholder() {
    // This will be expanded when MCP is implemented
    return {
      registerChannel: (channel: string) => {
        log(`MCP channel registered (placeholder): ${channel}`, 'integration');
      }
    };
  }
}

// Export the singleton instance
export const integrationEngine = IntegrationEngine.getInstance();