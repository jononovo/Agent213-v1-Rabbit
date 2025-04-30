/**
 * Shared Workflow Types
 * 
 * This file contains type definitions used for workflow execution
 * and job management across the three-server architecture.
 */

import { Response } from 'express';
import { NodeExecutionData } from '../nodeTypes';

/**
 * Job represents a pending workflow execution request
 */
export interface Job {
  id: string;
  type?: string;
  status?: string;
  data: {
    workflowId: number;
    input?: any;
    agentId?: number;
    startNodeId?: string;
    [key: string]: any;
  };
  options?: WorkflowExecutionOptions;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  updatedAt?: Date;
}

/**
 * Configuration options for workflow execution
 */
export interface WorkflowExecutionOptions {
  includeDetail?: boolean;
  executionMode?: 'normal' | 'debug' | 'webhook';
  debug?: boolean;
  timeout?: number;
}

/**
 * Execution context for a workflow
 * Tracks the state during execution
 */
export interface WorkflowExecutionContext {
  workflowId: number;
  nodeResults: Map<string, any>;
  startedAt: Date;
  errors: Map<string, string>;
  aborted: boolean;
}

/**
 * Results of validating a workflow before execution
 */
export interface WorkflowValidationResult {
  valid: boolean;
  missingExecutors: string[];
}

/**
 * Output from a workflow execution
 */
export interface WorkflowExecutionOutput {
  results: any[];
  errors: Record<string, string>;
  executionTime: number;
  status: 'completed' | 'completed_with_errors' | 'failed' | 'aborted';
  webhookResponseHandled?: boolean;
}

/**
 * Pending webhook response
 * Used to track HTTP responses that are waiting for workflow execution
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