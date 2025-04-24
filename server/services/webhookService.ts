/**
 * Webhook Service for external callbacks
 * 
 * This service provides utilities for sending webhook callbacks to external systems
 */

import fetch from 'node-fetch';
import { log } from '../vite';

/**
 * Send a webhook callback to an external system
 * 
 * @param callbackUrl The URL to send the callback to
 * @param data The data to send in the callback
 * @param options Additional options for the request
 * @returns Promise that resolves when the callback is sent
 */
export async function sendWebhookCallback(
  callbackUrl: string, 
  data: any, 
  options: { 
    method?: string, 
    headers?: Record<string, string>,
    timeout?: number,
    logPrefix?: string
  } = {}
): Promise<any> {
  const { 
    method = 'POST', 
    headers = { 'Content-Type': 'application/json' },
    timeout = 10000,
    logPrefix = 'WebhookCallback'
  } = options;

  // Generate a unique ID for this callback
  const callbackId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    log(`[${logPrefix}] [${callbackId}] Sending callback to ${callbackUrl}`, 'webhook');
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(callbackUrl, {
      method,
      headers,
      body: JSON.stringify(data),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`[${logPrefix}] [${callbackId}] Callback failed with status ${response.status}: ${errorText}`, 'webhook');
      return { 
        success: false, 
        status: response.status, 
        message: `Callback failed with status ${response.status}`,
        error: errorText
      };
    }
    
    const responseData = await response.json().catch(() => ({}));
    log(`[${logPrefix}] [${callbackId}] Callback sent successfully`, 'webhook');
    
    return { 
      success: true,
      status: response.status,
      data: responseData
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`[${logPrefix}] [${callbackId}] Error sending callback: ${errorMessage}`, 'webhook');
    console.error(`[${logPrefix}] Error details:`, error);
    
    return {
      success: false,
      message: `Error sending callback: ${errorMessage}`,
      error: String(error)
    };
  }
}

/**
 * Send a progress update to a lead generation callback URL
 */
export async function sendLeadGenProgressUpdate(
  callbackUrl: string, 
  data: {
    searchId: string,
    status: string,
    stage: string,
    progress: number,
    results: any
  }
): Promise<any> {
  return sendWebhookCallback(callbackUrl, {
    ...data,
    timestamp: new Date().toISOString()
  }, {
    logPrefix: 'LeadGenProgress'
  });
}

/**
 * Send a final lead generation result to a callback URL
 */
export async function sendLeadGenFinalResult(
  callbackUrl: string,
  data: {
    searchId: string,
    results: {
      companies: any[],
      contacts: any[]
    }
  }
): Promise<any> {
  return sendWebhookCallback(callbackUrl, {
    ...data,
    status: 'completed',
    timestamp: new Date().toISOString()
  }, {
    logPrefix: 'LeadGenResult'
  });
}