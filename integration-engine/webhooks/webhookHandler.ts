/**
 * Webhook Handler
 * 
 * This module manages webhook requests and forwards them to the workflow execution server.
 * It also maintains state for pending webhook responses.
 */

import { v4 as uuidv4 } from 'uuid';
import { WebhookRequest, WebhookResponse, WebhookStats } from '../../shared/types/webhook';
import * as persistentStore from './persistentStore';
import fetch from 'node-fetch';

// Configuration
const WORKFLOW_EXECUTION_URL = process.env.WORKFLOW_EXECUTION_URL || 'http://localhost:3002';
const DEFAULT_WEBHOOK_TIMEOUT_MS = 60000; // 1 minute default timeout

/**
 * Forward a webhook to the workflow execution server
 */
export async function forwardWebhookToWorkflowExecution(
  webhook: WebhookRequest
): Promise<void> {
  try {
    // Store the webhook request for potential async response
    await persistentStore.storeWebhookRequest(webhook);
    
    // Forward to workflow execution server
    const url = `${WORKFLOW_EXECUTION_URL}/api/webhook`;
    
    console.log(`Forwarding webhook ${webhook.id} to workflow execution: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhook)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error forwarding webhook to workflow execution: ${response.status} ${errorText}`);
      throw new Error(`Workflow execution server error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    // If the workflow engine responded immediately (sync execution)
    if (result.immediate) {
      // Store the response
      const webhookResponse: WebhookResponse = {
        webhookId: webhook.id,
        success: result.success,
        statusCode: result.statusCode || 200,
        headers: result.headers || { 'Content-Type': 'application/json' },
        body: result.body,
        error: result.error,
        timestamp: Date.now()
      };
      
      await persistentStore.storeWebhookResponse(webhookResponse);
    }
    // Otherwise the workflow will send a response later via the webhook-response API
    
  } catch (error) {
    console.error('Error forwarding webhook to workflow execution:', error);
    
    // Create an error response
    const errorResponse: WebhookResponse = {
      webhookId: webhook.id,
      success: false,
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Error forwarding webhook to workflow execution'
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
    
    await persistentStore.storeWebhookResponse(errorResponse);
  }
}

/**
 * Create a new webhook request from an HTTP request
 */
export function createWebhookRequest(
  workflowId: string | number,
  nodeId: string,
  method: string,
  headers: Record<string, string>,
  query: Record<string, string>,
  body: any,
  path: string,
  options: {
    respondDirectly?: boolean;
    timeoutMs?: number;
  } = {}
): WebhookRequest {
  return {
    id: uuidv4(),
    workflowId,
    nodeId,
    timestamp: Date.now(),
    method,
    headers,
    query,
    body,
    path,
    respondDirectly: options.respondDirectly || false,
    timeoutMs: options.timeoutMs || DEFAULT_WEBHOOK_TIMEOUT_MS
  };
}

/**
 * Check if a webhook response is ready
 */
export function hasWebhookResponse(webhookId: string): boolean {
  return persistentStore.getWebhookResponse(webhookId) !== undefined;
}

/**
 * Get a webhook response by ID
 */
export function getWebhookResponse(webhookId: string): WebhookResponse | undefined {
  return persistentStore.getWebhookResponse(webhookId);
}

/**
 * Create and store a webhook response
 */
export async function createWebhookResponse(
  webhookId: string,
  status: number,
  headers: Record<string, string>,
  body: any,
  success: boolean = true,
  error?: string
): Promise<WebhookResponse> {
  const response: WebhookResponse = {
    webhookId,
    success,
    statusCode: status,
    headers,
    body,
    error,
    timestamp: Date.now()
  };
  
  await persistentStore.storeWebhookResponse(response);
  return response;
}

/**
 * Get statistics about pending webhooks
 */
export function getWebhookStats(): WebhookStats {
  return persistentStore.getWebhookStats();
}

/**
 * Remove a webhook response from memory after it's been sent
 */
export function cleanupWebhookResponse(webhookId: string): void {
  console.log(`Cleaning up webhook response for ${webhookId}`);
  return persistentStore.cleanupWebhookResponse(webhookId);
}