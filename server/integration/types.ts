/**
 * Integration Engine Type Definitions
 */

import { Request, Response } from 'express';

/**
 * Node Type Handler
 * A function that handles requests for a specific node type
 */
export interface NodeTypeHandler {
  (req: Request, res: Response, params: Record<string, string>): Promise<void>;
}

/**
 * Integration Node Registration
 * Data structure for registering an integration node
 */
export interface IntegrationNodeRegistration {
  nodeType: string;
  capabilities: IntegrationCapabilities;
  workflowId?: number;
  nodeId?: string;
  description?: string;
}

/**
 * Integration Capabilities
 * Describes what a node can do and what it needs
 */
export interface IntegrationCapabilities {
  provides?: {
    endpoint?: boolean;
    webhook?: boolean;
    scheduler?: boolean;
    connector?: boolean;
    ai?: boolean;
  };
  
  requires?: {
    storage?: boolean;
    authentication?: boolean;
    proxy?: boolean;
  };
  
  endpoint?: {
    pathTemplate?: string;
    methods?: string[];
    authTypes?: string[];
  };
  
  externalApi?: {
    baseUrl?: string;
    defaultEndpoint?: string;
    authType?: string;
    documentation?: string;
  };
}

/**
 * Integration API Request
 * Data structure for making API requests through the Integration Engine
 */
export interface IntegrationApiRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  params?: Record<string, string>;
}

/**
 * Integration API Response
 * Data structure for API responses from the Integration Engine
 */
export interface IntegrationApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  ok: boolean;
}

/**
 * Endpoint Information
 * Data structure for registered endpoints
 */
export interface EndpointInfo {
  pathTemplate: string;
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  description?: string;
}