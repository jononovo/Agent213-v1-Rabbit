/**
 * Webhook Integration Node Definition
 * 
 * This node represents a webhook endpoint that can receive external HTTP requests
 * and trigger workflow execution. It's part of the Integration Engine system.
 */

import { NodeDefinition } from '@/types';

// Define the structure of node data
export interface WebhookIntegrationData {
  label: string;
  description: string;
  path: string;            // The webhook endpoint path 
  method: string;          // HTTP method (GET, POST, etc.)
  requireAuth: boolean;    // Whether authentication is required
  authType?: string;       // Type of authentication (token, basic, etc.)
  webhookSecret?: string;  // Secret for webhook validation
  webhookId?: string;      // Unique ID for this webhook
  webhookUrl?: string;     // Full URL of the webhook (generated)
}

// Default data for this node type
export const defaultData: WebhookIntegrationData = {
  label: 'Webhook Trigger',
  description: 'Receives data from external webhook calls',
  path: '/incoming-webhook',
  method: 'POST',
  requireAuth: false,
};

// Node definition for registration in the node registry
export const definition: NodeDefinition = {
  type: 'webhook_integration',
  name: 'Webhook Trigger',
  description: 'Receives data from external webhook calls and triggers workflow execution',
  category: 'integration',
  defaultData,
  
  // Integration nodes have special integration configuration
  integrationConfig: {
    // This node provides a webhook endpoint
    provides: ['webhook'],
    // This node doesn't require any external services
    requires: [],
  },
  
  // No input ports as this is a trigger node
  inputs: {},
  
  // Output ports
  outputs: {
    payload: {
      type: 'object',
      description: 'The HTTP request payload'
    },
    headers: {
      type: 'object',
      description: 'HTTP request headers'
    },
    params: {
      type: 'object',
      description: 'URL query parameters'
    }
  }
};