/**
 * Persistent Store for Webhook Responses
 * 
 * This module provides a persistence layer for webhook responses, allowing
 * webhook data to persist across server restarts and providing a way for
 * workflow nodes to respond to webhooks asynchronously.
 */

import { WebhookRequest, WebhookResponse } from '../../shared/types/webhook';
import Database from '@replit/database';

// Initialize Replit Database for persistence
const db = new Database();
const WEBHOOK_PREFIX = 'webhook:';
const WEBHOOK_LIST_KEY = 'webhook_list';

// In-memory cache for quick access
let pendingWebhooks: Map<string, WebhookRequest> = new Map();
let webhookResponses: Map<string, WebhookResponse> = new Map();

/**
 * Initialize the persistence layer
 * Loads any saved webhook state from Replit Database
 */
export async function initializeStore(): Promise<void> {
  try {
    console.log('Initializing webhook persistence store...');
    
    // Load the list of active webhook IDs
    const webhookIds = await db.get(WEBHOOK_LIST_KEY) as string[] || [];
    console.log(`Found ${webhookIds.length} stored webhooks`);
    
    // Load each webhook from the database
    for (const id of webhookIds) {
      try {
        const key = `${WEBHOOK_PREFIX}${id}`;
        const webhook = await db.get(key) as WebhookRequest;
        
        if (webhook) {
          pendingWebhooks.set(id, webhook);
          console.log(`Loaded webhook ${id} for workflow ${webhook.workflowId}, node ${webhook.nodeId}`);
        }
      } catch (err) {
        console.error(`Error loading webhook ${id}:`, err);
      }
    }
    
    console.log('Webhook store initialized successfully');
  } catch (err) {
    console.error('Error initializing webhook store:', err);
  }
}

/**
 * Store a webhook request
 */
export async function storeWebhookRequest(webhook: WebhookRequest): Promise<void> {
  try {
    pendingWebhooks.set(webhook.id, webhook);
    
    // Save to persistent storage
    const key = `${WEBHOOK_PREFIX}${webhook.id}`;
    await db.set(key, webhook);
    
    // Update the list of active webhooks
    const webhookIds = Array.from(pendingWebhooks.keys());
    await db.set(WEBHOOK_LIST_KEY, webhookIds);
    
    console.log(`Stored webhook ${webhook.id} for workflow ${webhook.workflowId}, node ${webhook.nodeId}`);
  } catch (err) {
    console.error('Error storing webhook:', err);
  }
}

/**
 * Store a webhook response
 */
export async function storeWebhookResponse(response: WebhookResponse): Promise<void> {
  try {
    webhookResponses.set(response.webhookId, response);
    
    // Remove from pending webhooks
    pendingWebhooks.delete(response.webhookId);
    
    // Remove from persistent storage
    const key = `${WEBHOOK_PREFIX}${response.webhookId}`;
    await db.delete(key);
    
    // Update the list of active webhooks
    const webhookIds = Array.from(pendingWebhooks.keys());
    await db.set(WEBHOOK_LIST_KEY, webhookIds);
    
    console.log(`Stored response for webhook ${response.webhookId}`);
  } catch (err) {
    console.error('Error storing webhook response:', err);
  }
}

/**
 * Get a pending webhook request by ID
 */
export function getWebhookRequest(id: string): WebhookRequest | undefined {
  return pendingWebhooks.get(id);
}

/**
 * Get a webhook response by ID
 */
export function getWebhookResponse(id: string): WebhookResponse | undefined {
  return webhookResponses.get(id);
}

/**
 * Check if a webhook exists
 */
export function hasWebhook(id: string): boolean {
  return pendingWebhooks.has(id);
}

/**
 * Get all pending webhooks
 */
export function getAllPendingWebhooks(): WebhookRequest[] {
  return Array.from(pendingWebhooks.values());
}

/**
 * Remove old webhook responses after they've been sent
 */
export function cleanupWebhookResponse(id: string): void {
  webhookResponses.delete(id);
}

/**
 * Get statistics about pending webhooks
 */
export function getWebhookStats() {
  const pendingWebhooksList = Array.from(pendingWebhooks.values()).map(webhook => ({
    id: webhook.id,
    workflowId: webhook.workflowId,
    nodeId: webhook.nodeId,
    timestamp: webhook.timestamp,
    age: Date.now() - webhook.timestamp
  }));
  
  return {
    totalPending: pendingWebhooks.size,
    pendingWebhooks: pendingWebhooksList
  };
}

// Initialize the store when this module is loaded
initializeStore().catch(err => {
  console.error('Failed to initialize webhook store:', err);
});