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
  nodeType?: string;
  description?: string;
  handler: EndpointHandler;
}

export interface StorableEndpointConfig {
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  nodeType?: string;
  description?: string;
  type: string; // 'webhook', 'api', etc.
}

export interface NodeTypeHandler {
  (req: Request, res: Response, params: Record<string, string>): Promise<void>;
}

export interface NodeTypeConfig {
  pathTemplate: string;
  methods: string[];
  description?: string;
  nodeTypeHandler: NodeTypeHandler;
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
  
  // Store node type handlers (used for nodes in the Integration folder)
  private nodeTypeHandlers: Map<string, NodeTypeConfig> = new Map();
  
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
    
    // Try to match based on node type handlers
    // This checks if the path matches a node type's path template
    if (this.nodeTypeHandlers.size > 0) {
      // Parse path segments to match against templates
      const pathSegments = normalizedPath.split('/');
      
      // Check if the first segment matches a node type path pattern
      // For example, if path is "webhooks/my-hook" and we have a node handler for "webhooks/:path"
      if (pathSegments.length >= 1) {
        const firstSegment = pathSegments[0];
        
        // Check for node handlers that might match this path pattern
        // Convert to array first to avoid TypeScript downlevelIteration issues
        const nodeTypeEntries = Array.from(this.nodeTypeHandlers.entries());
        
        // Sort node type entries by specificity (longest and most specific template first)
        const sortedNodeTypeEntries = nodeTypeEntries.sort((a, b) => {
          const aTemplate = a[1].pathTemplate;
          const bTemplate = b[1].pathTemplate;
          
          // Count static segments (not parameters)
          const aStaticSegments = aTemplate.split('/').filter(seg => !seg.startsWith(':')).length;
          const bStaticSegments = bTemplate.split('/').filter(seg => !seg.startsWith(':')).length;
          
          // If different number of static segments, prefer more static segments
          if (aStaticSegments !== bStaticSegments) {
            return bStaticSegments - aStaticSegments; // Descending order
          }
          
          // Otherwise prefer longer templates
          return bTemplate.length - aTemplate.length; // Descending order
        });
        
        // Try each node type handler
        for (let i = 0; i < sortedNodeTypeEntries.length; i++) {
          const [nodeType, config] = sortedNodeTypeEntries[i];
          
          // Check if template could potentially match this path
          // Use basic path prefix matching for now
          const templatePrefix = config.pathTemplate.split('/')[0];
          if (normalizedPath.startsWith(templatePrefix) || normalizedPath.startsWith('/' + templatePrefix)) {
            log(`Trying node type handler: ${nodeType} for path: ${normalizedPath}`, 'integration');
            
            // Try to handle with this node type
            const handled = await this.handleNodeTypeRequest(
              nodeType,
              normalizedPath,
              req,
              res
            );
            
            if (handled) {
              return true;
            }
          }
        }
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
   * Register a node type handler for integration nodes
   * This enables registration of integration capabilities by node types
   */
  async registerNodeType(
    nodeType: string,
    config: NodeTypeConfig
  ): Promise<void> {
    await this.ensureInitialized();
    
    this.nodeTypeHandlers.set(nodeType, config);
    log(`Registered integration node type: ${nodeType}`, 'integration');
    
    // Log the path template for debugging
    log(`Node ${nodeType} handles path template: ${config.pathTemplate}`, 'integration');
  }
  
  /**
   * Unregister a node type handler
   */
  async unregisterNodeType(nodeType: string): Promise<boolean> {
    await this.ensureInitialized();
    
    if (this.nodeTypeHandlers.has(nodeType)) {
      this.nodeTypeHandlers.delete(nodeType);
      log(`Unregistered integration node type: ${nodeType}`, 'integration');
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all registered node type handlers
   */
  async getNodeTypes(): Promise<string[]> {
    await this.ensureInitialized();
    return Array.from(this.nodeTypeHandlers.keys());
  }
  
  /**
   * Create a workflow instance for a node type
   * This method handles dynamic integration requests based on node types
   */
  async handleNodeTypeRequest(
    nodeType: string,
    path: string,
    req: Request, 
    res: Response
  ): Promise<boolean> {
    await this.ensureInitialized();
    
    // Check if we have a handler for this node type
    if (!this.nodeTypeHandlers.has(nodeType)) {
      return false;
    }
    
    const config = this.nodeTypeHandlers.get(nodeType)!;
    
    // Check if the HTTP method is allowed
    if (!config.methods.includes('*') && !config.methods.includes(req.method)) {
      res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed for this node type`
      });
      return true;
    }
    
    try {
      // Extract path parameters from the URL
      // This would match parameters like :id, :path in URL templates
      const pathParams: Record<string, string> = this.extractPathParams(config.pathTemplate, path);
      
      // Log extracted parameters for debugging
      log(`Extracted path params for ${nodeType}: ${JSON.stringify(pathParams)}`, 'integration');
      
      // Execute the handler with path parameters
      await config.nodeTypeHandler(req, res, pathParams);
      return true;
    } catch (error) {
      console.error(`Error handling node type request for ${nodeType}:`, error);
      
      // Only send response if it hasn't been sent already
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: `Error processing ${nodeType} request`,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      return true;
    }
  }
  
  /**
   * Check if a path could potentially match a template
   * This is a quick check to filter out obviously non-matching templates
   * before doing more expensive param extraction
   */
  private couldMatchPath(template: string, path: string): boolean {
    // Normalize paths
    const normalizedTemplate = template.startsWith('/') ? template : `/${template}`;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Split into segments
    const templateSegments = normalizedTemplate.split('/').filter(Boolean);
    const pathSegments = normalizedPath.split('/').filter(Boolean);
    
    // Can't match if path is shorter than template's static parts
    const staticTemplateSegments = templateSegments.filter(seg => !seg.startsWith(':'));
    if (pathSegments.length < staticTemplateSegments.length) {
      return false;
    }
    
    // Check that template's static segments match corresponding path segments
    for (let i = 0; i < templateSegments.length && i < pathSegments.length; i++) {
      const templateSegment = templateSegments[i];
      const pathSegment = pathSegments[i];
      
      // Skip param segments (they'll match anything)
      if (templateSegment.startsWith(':')) {
        continue;
      }
      
      // Static segment must match exactly
      if (templateSegment !== pathSegment) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Extract path parameters from a URL based on a template
   * Simple utility to extract named parameters from paths
   * 
   * Example:
   * Template: /webhooks/:hookId/events/:eventType
   * Path: /webhooks/1234/events/update
   * Result: { hookId: '1234', eventType: 'update' }
   */
  private extractPathParams(template: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Normalize paths
    const normalizedTemplate = template.startsWith('/') ? template : `/${template}`;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Split into segments
    const templateSegments = normalizedTemplate.split('/').filter(Boolean);
    const pathSegments = normalizedPath.split('/').filter(Boolean);
    
    // Match segments and extract params
    for (let i = 0; i < templateSegments.length && i < pathSegments.length; i++) {
      const templateSegment = templateSegments[i];
      const pathSegment = pathSegments[i];
      
      // Check if this is a named parameter
      if (templateSegment.startsWith(':')) {
        const paramName = templateSegment.substring(1);
        params[paramName] = pathSegment;
      } else if (templateSegment !== pathSegment) {
        // If not a param and segments don't match, we're on the wrong path
        return {};
      }
    }
    
    return params;
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