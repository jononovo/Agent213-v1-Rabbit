/**
 * Webhook Handler for Integration Engine
 * 
 * This module manages pending webhook responses and provides functionality
 * to register and send responses to webhook requests.
 */

import { Response } from 'express';
import { PendingWebhookResponse, WebhookStats } from '../../shared/types/webhook';
import { persistentStore } from './persistentStore';

// Store pending HTTP responses for webhook processing
const pendingResponses = new Map<string, PendingWebhookResponse>();

// Default timeout for webhook responses (in milliseconds)
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// Initialize by loading any persisted webhooks
async function initializePersistence(): Promise<void> {
  try {
    // Clean up any stale webhooks first
    const cleanupCount = await persistentStore.cleanupStaleWebhooks();
    if (cleanupCount > 0) {
      console.log(`[Integration Engine] Cleaned up ${cleanupCount} stale webhook entries`);
    }
    
    // Note: We can't restore actual response objects, so this is mainly for cleanup
  } catch (error) {
    console.error('[Integration Engine] Error initializing webhook persistence:', error);
  }
}

// Initialize persistence system
initializePersistence().catch(console.error);

/**
 * Register a pending webhook response
 * 
 * @param requestId Unique identifier for the webhook request
 * @param res Express Response object to respond to later
 * @param workflowId ID of the workflow being executed
 * @param timeoutMs Optional custom timeout in milliseconds
 */
export function registerPendingResponse(
  requestId: string, 
  res: Response, 
  workflowId: number,
  timeoutMs: number = DEFAULT_TIMEOUT
): void {
  // Create timeout that will automatically respond if no explicit response is sent
  const timeout = setTimeout(() => {
    if (pendingResponses.has(requestId)) {
      const { res } = pendingResponses.get(requestId)!;
      
      if (!res.headersSent) {
        res.status(202).json({
          success: true,
          message: "Webhook received and processing started, but no explicit response was sent within the timeout period",
          requestId
        });
      }
      
      pendingResponses.delete(requestId);
      persistentStore.removeResponse(requestId).catch(console.error);
      console.log(`[Integration Engine] Auto-response sent for webhook ${requestId} (timeout reached)`);
    }
  }, timeoutMs);
  
  const now = Date.now();
  
  // Store the response object
  pendingResponses.set(requestId, { 
    res, 
    timeout,
    workflowId,
    timestamp: now
  });
  
  // Persist basic metadata for recovery
  persistentStore.saveResponse(requestId, { workflowId }).catch(console.error);
  
  console.log(`[Integration Engine] Registered pending response for requestId ${requestId} (workflow ${workflowId})`);
}

/**
 * Send a response to a pending webhook request
 * 
 * @param requestId ID of the pending request
 * @param data Response data to send
 * @param statusCode HTTP status code
 * @returns True if response was sent successfully, false otherwise
 */
export function sendWebhookResponse(
  requestId: string, 
  data: any, 
  statusCode: number = 200
): boolean {
  // Look up the pending response
  const pendingResponse = pendingResponses.get(requestId);
  
  if (!pendingResponse) {
    console.log(`[Integration Engine] No pending response found for request ${requestId}`);
    return false;
  }
  
  // Clear the timeout
  clearTimeout(pendingResponse.timeout);
  
  // Send the response to the original webhook caller
  if (!pendingResponse.res.headersSent) {
    pendingResponse.res.status(statusCode).json(data);
    console.log(`[Integration Engine] Webhook response sent for request ${requestId}`);
    
    // Clean up
    pendingResponses.delete(requestId);
    persistentStore.removeResponse(requestId).catch(console.error);
    return true;
  } else {
    console.log(`[Integration Engine] Response already sent for request ${requestId}`);
    
    // Clean up anyway
    pendingResponses.delete(requestId);
    persistentStore.removeResponse(requestId).catch(console.error);
    return false;
  }
}

/**
 * Get statistics about pending webhook responses
 */
export function getWebhookStats(): WebhookStats {
  return {
    pendingCount: pendingResponses.size,
    pendingIds: Array.from(pendingResponses.keys()),
    workflowIds: Array.from(pendingResponses.values()).map(pr => pr.workflowId)
  };
}

// Export the pendingResponses map for testing
export { pendingResponses };