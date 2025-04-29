/**
 * Integration Engine Routes
 * 
 * This file defines the API routes for the Integration Engine server.
 * It handles webhook registrations, API requests, and workflow execution.
 */

import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { storage } from '../storage';
import { broadcastToClients } from './index';
import { NodeTypeHandler } from './types';

// Create router
const router = Router();

// Storage for registered node type handlers
const nodeTypeHandlers = new Map<string, NodeTypeHandler>();

// Storage for registered endpoints
const endpoints = new Map<string, {
  pathTemplate: string;
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  description?: string;
}>();

/**
 * Register a node type handler
 * 
 * @param nodeType The type of node to register
 * @param handler The handler function for the node type
 */
export function registerNodeTypeHandler(nodeType: string, handler: NodeTypeHandler): void {
  nodeTypeHandlers.set(nodeType, handler);
  console.log(`[Integration Engine] Registered handler for node type: ${nodeType}`);
}

/**
 * Register an endpoint with the Integration Engine
 * 
 * @param path The path template for the endpoint
 * @param methods The HTTP methods supported by the endpoint
 * @param workflowId The ID of the workflow associated with the endpoint
 * @param nodeId The ID of the node associated with the endpoint
 * @param description A description of the endpoint
 */
export function registerEndpoint(
  pathTemplate: string,
  methods: string[],
  workflowId?: number,
  nodeId?: string,
  description?: string
): void {
  endpoints.set(pathTemplate, {
    pathTemplate,
    methods,
    workflowId,
    nodeId,
    description
  });
  
  console.log(`[Integration Engine] Registered endpoint: ${pathTemplate}`);
  
  // Broadcast endpoint registration to connected clients
  broadcastToClients({
    type: 'endpoint_registered',
    endpoint: {
      path: pathTemplate,
      methods,
      workflowId,
      nodeId,
      description
    }
  });
}

/**
 * Handle dynamic path parameters
 * 
 * @param pathTemplate The path template with parameters
 * @param actualPath The actual path from the request
 * @returns Extracted parameters or null if no match
 */
export function extractPathParams(
  pathTemplate: string,
  actualPath: string
): Record<string, string> | null {
  // Split both paths into segments
  const templateSegments = pathTemplate.split('/');
  const pathSegments = actualPath.split('/');
  
  // If they have different lengths, they can't match
  if (templateSegments.length !== pathSegments.length) {
    return null;
  }
  
  // Extract parameters
  const params: Record<string, string> = {};
  
  for (let i = 0; i < templateSegments.length; i++) {
    const template = templateSegments[i];
    const path = pathSegments[i];
    
    // Check if this segment is a parameter
    if (template.startsWith(':')) {
      // Add to parameters
      params[template.substring(1)] = path;
    } else if (template !== path) {
      // If not a parameter and segments don't match, templates don't match
      return null;
    }
  }
  
  return params;
}

// ==== API Routes ====

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'integration-engine' });
});

/**
 * Register a new integration endpoint
 */
router.post('/integration/register', async (req: Request, res: Response) => {
  try {
    const { pathTemplate, methods, workflowId, nodeId, description } = req.body;
    
    if (!pathTemplate) {
      return res.status(400).json({ error: 'Path template is required' });
    }
    
    if (!methods || !Array.isArray(methods) || methods.length === 0) {
      return res.status(400).json({ error: 'Methods array is required' });
    }
    
    // Register the endpoint
    registerEndpoint(pathTemplate, methods, workflowId, nodeId, description);
    
    // Return success response
    res.status(201).json({
      success: true,
      endpoint: {
        path: pathTemplate,
        methods,
        workflowId,
        nodeId,
        description
      }
    });
  } catch (error) {
    console.error('[Integration Engine] Error registering endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register endpoint',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Register a node type handler
 */
router.post('/integration/register-node-type', (req: Request, res: Response) => {
  try {
    const { nodeType, handler } = req.body;
    
    if (!nodeType) {
      return res.status(400).json({ error: 'Node type is required' });
    }
    
    if (!handler || typeof handler !== 'string') {
      return res.status(400).json({ error: 'Handler is required and must be a string' });
    }
    
    // We can't directly register a function from the client, so we're just
    // storing the node type for now. In a real implementation, the handler
    // would be loaded dynamically from the server.
    
    console.log(`[Integration Engine] Registered node type: ${nodeType}`);
    
    res.status(201).json({
      success: true,
      nodeType
    });
  } catch (error) {
    console.error('[Integration Engine] Error registering node type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register node type',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get all registered integration endpoints
 */
router.get('/integration/endpoints', (req: Request, res: Response) => {
  try {
    const registeredEndpoints = Array.from(endpoints.values());
    
    res.json({
      success: true,
      endpoints: registeredEndpoints
    });
  } catch (error) {
    console.error('[Integration Engine] Error getting endpoints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get endpoints',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get all registered node types
 */
router.get('/integration/node-types', (req: Request, res: Response) => {
  try {
    const registeredNodeTypes = Array.from(nodeTypeHandlers.keys());
    
    res.json({
      success: true,
      nodeTypes: registeredNodeTypes
    });
  } catch (error) {
    console.error('[Integration Engine] Error getting node types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get node types',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Make an outgoing API request
 */
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
    const apiResponse = await fetch(url, fetchOptions);
    
    // Get response data
    let responseData: any;
    const contentType = apiResponse.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await apiResponse.json();
    } else {
      responseData = await apiResponse.text();
    }
    
    // Build the response object
    const response = {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: Object.fromEntries(apiResponse.headers.entries()),
      data: responseData,
      ok: apiResponse.ok
    };
    
    // Return the response
    res.json(response);
    
  } catch (error) {
    console.error('[Integration Engine] API request error:', error);
    res.status(500).json({ 
      error: `Error making API request: ${error instanceof Error ? error.message : String(error)}`,
      ok: false 
    });
  }
});

/**
 * Run a workflow
 */
router.post('/integration/run-workflow', async (req: Request, res: Response) => {
  try {
    const { workflowId, input } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({ error: 'Workflow ID is required' });
    }
    
    // Get the workflow
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    console.log(`[Integration Engine] Running workflow ${workflowId}`);
    
    // In a real implementation, we would execute the workflow here
    // For now, we'll just return a dummy response
    
    // Create a log entry
    const logEntry = {
      agentId: workflow.agentId || 1,
      workflowId,
      status: 'running',
      input,
      output: {},
      executionPath: {
        execution_type: 'workflow_execution',
        source: 'integration_engine',
        message: `Starting workflow execution from Integration Engine: ${workflow.name}`,
        status: 'in_progress'
      }
    };
    
    const log = await storage.createLog(logEntry);
    
    // Broadcast workflow execution to connected clients
    broadcastToClients({
      type: 'workflow_execution_started',
      workflowId,
      logId: log.id,
      input
    });
    
    // Return the log ID
    res.json({
      success: true,
      logId: log.id,
      message: 'Workflow execution started'
    });
  } catch (error) {
    console.error('[Integration Engine] Error running workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run workflow',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Dynamic route handler for integration endpoints
 */
router.all('/integration/*', async (req: Request, res: Response) => {
  try {
    // Extract the path after /api/integration/
    const path = req.path.substring('/integration/'.length);
    
    // Find a matching endpoint
    let matchedEndpoint: any = null;
    let params: Record<string, string> = {};
    
    for (const [pathTemplate, endpoint] of endpoints.entries()) {
      const extractedParams = extractPathParams(pathTemplate, path);
      
      if (extractedParams !== null) {
        matchedEndpoint = endpoint;
        params = extractedParams;
        break;
      }
    }
    
    // If no matching endpoint found, return 404
    if (!matchedEndpoint) {
      return res.status(404).json({
        success: false,
        message: 'Integration endpoint not found'
      });
    }
    
    // Check if the method is allowed
    if (!matchedEndpoint.methods.includes(req.method)) {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed for this endpoint`
      });
    }
    
    // Handle the request based on the workflow and node
    const { workflowId, nodeId } = matchedEndpoint;
    
    if (workflowId && nodeId) {
      // Create input data for the workflow
      const inputData = {
        path,
        params,
        query: req.query,
        body: req.body,
        headers: req.headers,
        method: req.method
      };
      
      // Create a log entry
      const logEntry = {
        agentId: 1, // Default to agent 1
        workflowId,
        status: 'running',
        input: inputData,
        output: {},
        executionPath: {
          execution_type: 'webhook_trigger',
          source: 'integration_engine',
          message: `Webhook triggered from Integration Engine for node ${nodeId}`,
          status: 'in_progress'
        }
      };
      
      const log = await storage.createLog(logEntry);
      
      // Broadcast webhook trigger to connected clients
      broadcastToClients({
        type: 'webhook_triggered',
        workflowId,
        nodeId,
        logId: log.id,
        input: inputData
      });
      
      // In a real implementation, we would execute the workflow here
      // For now, we'll just return a success response
      res.json({
        success: true,
        message: 'Webhook received successfully',
        logId: log.id
      });
    } else {
      // No workflow or node ID, just return a success response
      res.json({
        success: true,
        message: 'Endpoint called successfully',
        params
      });
    }
  } catch (error) {
    console.error('[Integration Engine] Error handling integration endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing integration request',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export router
export const integrationRoutes = router;