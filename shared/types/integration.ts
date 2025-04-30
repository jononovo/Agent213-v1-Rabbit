/**
 * Shared Integration Types
 * 
 * This file contains type definitions used for external integrations, 
 * webhooks, and API connections across the three-server architecture.
 */

import { Request, Response } from 'express';

/**
 * Handler function for processing integration endpoints
 */
export interface EndpointHandler {
  (req: Request, res: Response): Promise<void>;
}

/**
 * Configuration for a registered endpoint
 */
export interface EndpointConfig {
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  nodeType?: string;
  description?: string;
  handler: EndpointHandler;
}

/**
 * Configuration for storing endpoint information
 * This version is used for persistent storage (no function references)
 */
export interface StorableEndpointConfig {
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  nodeType?: string;
  description?: string;
  type: string; // 'webhook', 'api', etc.
}

/**
 * Handler for node type specific endpoints
 */
export interface NodeTypeHandler {
  (req: Request, res: Response, params: Record<string, string>): Promise<void>;
}

/**
 * Configuration for a node type handler
 */
export interface NodeTypeConfig {
  pathTemplate: string;
  methods: string[];
  description?: string;
  nodeTypeHandler: NodeTypeHandler;
}

/**
 * Provider for handling specific integration types
 */
export interface IntegrationProvider {
  name: string;
  channels?: string[];
  handleRequest: (path: string, req: Request, res: Response) => Promise<boolean>;
}

/**
 * Webhook payload with full context information
 */
export interface WebhookPayload {
  payload: any;
  headers: Record<string, string | string[] | undefined>;
  method: string;
  query: Record<string, any>;
  params: Record<string, string>;
  nodeId: string;
  requestId: string;
  responseContext: {
    isWebhookResponse: boolean;
    originalWebhookRequest: {
      path: string;
      method: string;
    }
  };
}

/**
 * Pending webhook response
 * Used to track HTTP responses that are waiting for a response
 */
export interface PendingWebhookResponse {
  /** Express response object */
  res: Response;
  /** Timeout handler ID */
  timeout: NodeJS.Timeout;
  /** ID of the associated workflow */
  workflowId: number;
}

/**
 * Webhook request data
 * Contains all information needed to process a webhook request
 */
export interface WebhookRequest {
  /** Workflow ID to trigger */
  workflowId: number;
  /** Node ID to start execution from */
  startNodeId: string;
  /** Request payload (body) */
  payload: any;
  /** HTTP headers */
  headers: Record<string, string | string[] | undefined>;
  /** HTTP method */
  method: string;
  /** Query parameters */
  query: Record<string, any>;
  /** Path parameters */
  params: Record<string, string>;
  /** Original request path */
  path: string;
  /** Unique request ID */
  requestId?: string;
}

/**
 * Webhook execution result
 */
export interface WebhookExecutionResult {
  /** Whether the execution was successful */
  success: boolean;
  /** Message describing the result */
  message: string;
  /** Output data from execution */
  output?: any;
  /** Error details if execution failed */
  error?: string;
  /** Whether the webhook response was handled */
  webhookResponseHandled?: boolean;
}