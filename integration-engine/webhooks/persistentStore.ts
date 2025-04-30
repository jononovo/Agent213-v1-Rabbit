/**
 * Persistent Store for Webhook Responses
 * 
 * This module provides minimal persistence for webhook response data
 * using the application's storage system.
 */

import { storage } from '../../server/storage';

/**
 * Simple implementation of persistent storage for webhook responses
 * Uses the existing storage module for minimal implementation
 */
class PersistentWebhookStore {
  private readonly PREFIX = 'webhook:';
  private initialized = false;

  /**
   * Save webhook metadata to persistent storage
   * Note: We can't persist the actual response object, only metadata
   */
  async saveResponse(requestId: string, metadata: { workflowId: number }): Promise<void> {
    try {
      await storage.saveSetting({
        id: `${this.PREFIX}${requestId}`,
        value: {
          ...metadata,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error(`Error saving webhook ${requestId}:`, error);
    }
  }

  /**
   * Remove webhook from persistent storage
   */
  async removeResponse(requestId: string): Promise<void> {
    try {
      await storage.saveSetting({
        id: `${this.PREFIX}${requestId}`,
        value: null // null value will remove the setting
      });
    } catch (error) {
      console.error(`Error removing webhook ${requestId}:`, error);
    }
  }

  /**
   * Load list of active webhooks from persistent storage
   */
  async getStoredWebhooks(): Promise<Record<string, { workflowId: number, timestamp: number }>> {
    try {
      const result: Record<string, { workflowId: number, timestamp: number }> = {};
      
      // Get all settings
      const allSettings = await storage.getSetting('settings');
      
      if (allSettings?.value && typeof allSettings.value === 'object') {
        // Look for webhook-prefixed keys
        Object.entries(allSettings.value).forEach(([key, value]) => {
          if (key.startsWith(this.PREFIX) && value) {
            const requestId = key.substring(this.PREFIX.length);
            result[requestId] = value as { workflowId: number, timestamp: number };
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error loading stored webhooks:', error);
      return {};
    }
  }

  /**
   * Cleanup stale webhook entries (older than maxAge ms)
   */
  async cleanupStaleWebhooks(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const storedWebhooks = await this.getStoredWebhooks();
      const now = Date.now();
      let count = 0;
      
      for (const [requestId, data] of Object.entries(storedWebhooks)) {
        if (now - data.timestamp > maxAge) {
          await this.removeResponse(requestId);
          count++;
        }
      }
      
      return count;
    } catch (error) {
      console.error('Error cleaning up stale webhooks:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const persistentStore = new PersistentWebhookStore();