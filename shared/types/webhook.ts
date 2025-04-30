/**
 * Consolidated Webhook Types
 * 
 * This file contains all types related to webhook handling,
 * eliminating duplication between integration and workflow types.
 */

import { Response } from 'express';

/**
 * Data structure for pending webhook responses
 */
export interface PendingWebhookResponse {
  /** Express response object */
  res: Response;
  /** Timeout handler ID */
  timeout: NodeJS.Timeout;
  /** ID of the associated workflow */
  workflowId: number;
  /** Timestamp when the response was registered */
  timestamp: number;
}

/**
 * Webhook request data structure
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
  /** URL parameters */
  params: Record<string, string>;
  /** Original request path */
  path: string;
  /** Unique request identifier */
  requestId: string;
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

/**
 * Webhook response data for statistics
 */
export interface WebhookStats {
  /** Number of pending responses */
  pendingCount: number;
  /** List of pending request IDs */
  pendingIds: string[];
  /** List of associated workflow IDs */
  workflowIds: number[];
}