/**
 * Webhook Types
 * 
 * This file defines shared types used for webhook handling across all servers
 */

// Webhook request data structure
export interface WebhookRequest {
  // Basic webhook identification
  id: string;
  workflowId: string | number;
  nodeId: string;
  timestamp: number;

  // HTTP request details
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: any;
  path: string;

  // Response handling details
  respondDirectly?: boolean;
  timeoutMs?: number;
}

// Webhook response data structure
export interface WebhookResponse {
  webhookId: string;
  success: boolean;
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
  timestamp: number;
}

// Status information about pending webhooks
export interface WebhookStats {
  totalPending: number;
  pendingWebhooks: {
    id: string;
    workflowId: string | number;
    nodeId: string;
    timestamp: number;
    age: number;
  }[];
}