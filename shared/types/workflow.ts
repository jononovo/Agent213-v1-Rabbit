/**
 * Shared Workflow Types
 * 
 * This file contains type definitions used for workflow execution
 * and job management across the three-server architecture.
 */

import { NodeExecutionData } from '../nodeTypes';

/**
 * Job represents a pending workflow execution request
 */
export interface Job {
  id: string;
  data: {
    workflowId: number;
    input?: any;
    agentId?: number;
    startNodeId?: string;
    [key: string]: any;
  };
  options?: WorkflowExecutionOptions;
  createdAt: Date;
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