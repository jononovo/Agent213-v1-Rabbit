/**
 * Shared Workflow Types
 * 
 * This file contains the core type definitions for workflow execution and job processing,
 * used by both the main server and workflow execution server.
 */

import { NodeExecutionData, WorkflowItem } from '../nodeTypes';

/**
 * Job interface for workflow queue
 */
export interface Job {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Pending webhook response tracking
 */
export interface PendingWebhookResponse {
  res: any; // Express Response object (typed as any to avoid circular dependencies)
  timeout: NodeJS.Timeout;
  workflowId: number;
}

/**
 * Workflow execution context for tracking state during workflow runs
 */
export interface WorkflowExecutionContext {
  workflowId: number;
  nodeResults: Map<string, any>;
  startedAt: Date;
  errors: Map<string, string>;
  aborted: boolean;
}

/**
 * Workflow validation result
 */
export interface WorkflowValidationResult {
  valid: boolean;
  missingExecutors: string[];
}

/**
 * Workflow execution output
 */
export interface WorkflowExecutionOutput {
  results: any[];
  errors: Record<string, string>;
  executionTime: number;
  status: 'completed' | 'completed_with_errors' | 'aborted' | 'failed';
}