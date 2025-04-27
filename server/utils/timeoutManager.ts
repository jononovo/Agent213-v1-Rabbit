/**
 * Workflow Timeout Manager
 * 
 * This utility manages timeouts for workflow executions to prevent workflows
 * from running indefinitely. It automatically marks workflows as timed out
 * if they've been running for longer than the specified timeout duration.
 */

import { storage } from '../storage';

// Default timeout duration in milliseconds (1 minute)
const DEFAULT_TIMEOUT = 60 * 1000;

// Map of running workflows and their timeout handlers
const runningWorkflows = new Map<number, {
  logId: number;
  startTime: Date;
  timeoutHandler: NodeJS.Timeout;
}>();

/**
 * Register a new workflow execution for timeout tracking
 * 
 * @param logId The ID of the log entry for this workflow execution
 * @param workflowId The ID of the workflow being executed
 * @param timeoutDuration Optional custom timeout duration in milliseconds
 * @returns A cleanup function to call if the workflow completes normally
 */
export function registerWorkflowExecution(
  logId: number, 
  workflowId: number, 
  timeoutDuration: number = DEFAULT_TIMEOUT
): () => void {
  // Create timeout handler
  const startTime = new Date();
  const timeoutHandler = setTimeout(async () => {
    try {
      console.warn(`Workflow ${workflowId} (Log ${logId}) timed out after ${timeoutDuration}ms`);
      
      // Get the log
      const log = await storage.getLog(logId);
      if (!log) {
        console.error(`Unable to find log ${logId} for timed out workflow ${workflowId}`);
        return;
      }
      
      // Only update if the log is still in a running state
      if (log.status === 'running' || log.status === 'in_progress') {
        await storage.updateLog(logId, {
          status: 'timed_out',
          error: `Workflow execution timed out after ${timeoutDuration}ms`,
          completedAt: new Date(),
          executionPath: {
            ...(log.executionPath || {}),
            message: `Workflow execution timed out after ${timeoutDuration / 1000} seconds`,
            status: 'timed_out'
          }
        });
        
        console.log(`Updated log ${logId} for workflow ${workflowId} to timed_out status`);
      }
      
      // Remove from running workflows
      runningWorkflows.delete(workflowId);
    } catch (error) {
      console.error(`Error handling workflow timeout for workflow ${workflowId}:`, error);
    }
  }, timeoutDuration);
  
  // Store in map
  runningWorkflows.set(workflowId, { 
    logId, 
    startTime, 
    timeoutHandler 
  });
  
  // Return cleanup function
  return () => {
    clearWorkflowExecution(workflowId);
  };
}

/**
 * Clear a workflow execution from the timeout tracking
 * 
 * @param workflowId The ID of the workflow to clear
 */
export function clearWorkflowExecution(workflowId: number): void {
  const workflowInfo = runningWorkflows.get(workflowId);
  if (workflowInfo) {
    clearTimeout(workflowInfo.timeoutHandler);
    runningWorkflows.delete(workflowId);
  }
}

/**
 * Get information about currently running workflows
 * 
 * @returns Array of running workflow information
 */
export function getRunningWorkflows(): Array<{
  workflowId: number;
  logId: number;
  startTime: Date;
  runningTime: number;
}> {
  const now = Date.now();
  return Array.from(runningWorkflows.entries()).map(([workflowId, info]) => ({
    workflowId,
    logId: info.logId,
    startTime: info.startTime,
    runningTime: now - info.startTime.getTime()
  }));
}

/**
 * Check for any workflows that have been running longer than their timeout
 * 
 * This can be called periodically to clean up any workflows that might have
 * been missed by the timeout system
 */
export async function checkForTimedOutWorkflows(): Promise<void> {
  const now = Date.now();
  
  // Get all logs in 'running' state
  const logs = await storage.getLogs();
  const runningLogs = logs.filter(log => 
    (log.status === 'running' || log.status === 'in_progress') && 
    log.startedAt && 
    !log.completedAt
  );
  
  for (const log of runningLogs) {
    // Skip if the workflow is already being tracked
    if (log.workflowId && runningWorkflows.has(log.workflowId)) {
      continue;
    }
    
    // Check if the log has been running for longer than the timeout
    const startTime = new Date(log.startedAt!).getTime();
    const runningTime = now - startTime;
    
    if (runningTime > DEFAULT_TIMEOUT) {
      console.warn(`Found timed out workflow ${log.workflowId} (Log ${log.id}) running for ${runningTime}ms`);
      
      // Update the log
      await storage.updateLog(log.id, {
        status: 'timed_out',
        error: `Workflow execution timed out after ${runningTime}ms`,
        completedAt: new Date(),
        executionPath: {
          ...(log.executionPath || {}),
          message: `Workflow execution timed out after ${runningTime / 1000} seconds`,
          status: 'timed_out'
        }
      });
      
      console.log(`Updated log ${log.id} for workflow ${log.workflowId} to timed_out status`);
    }
  }
}