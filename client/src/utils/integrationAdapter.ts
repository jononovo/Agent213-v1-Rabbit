/**
 * Integration Engine Adapter
 * 
 * This adapter provides a clean interface for the client to communicate with 
 * the Integration Engine server. It handles connection, request proxying,
 * and WebSocket communication.
 */

import { apiRequest } from '../lib/queryClient';
import { ApiRequestOptions } from './integrationClient';

// Integration Engine configuration
const ENGINE_PORT = 3001;
let ENGINE_URL = '';
let WS_URL = '';

// WebSocket connection
let ws: WebSocket | null = null;
let eventListeners: Record<string, ((data: any) => void)[]> = {};

/**
 * Initialize the Integration Engine adapter
 * This should be called early in the application lifecycle
 */
export function initIntegrationAdapter() {
  // Use the same hostname but the Integration Engine port
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    
    ENGINE_URL = `${protocol}//${hostname}:${ENGINE_PORT}`;
    WS_URL = `${wsProtocol}//${hostname}:${ENGINE_PORT}/ws`;
    
    // Connect to WebSocket
    connectWebSocket();
  }
}

/**
 * Connect to the Integration Engine WebSocket
 */
function connectWebSocket() {
  if (!WS_URL || typeof WebSocket === 'undefined') return;
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('[Integration Adapter] WebSocket connected');
      triggerEvent('connected', {});
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Integration Adapter] WebSocket message:', data);
        
        // Trigger event based on message type
        if (data.type) {
          triggerEvent(data.type, data);
        }
      } catch (error) {
        console.error('[Integration Adapter] WebSocket parse error:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('[Integration Adapter] WebSocket disconnected');
      triggerEvent('disconnected', {});
      
      // Try to reconnect after a delay
      setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('[Integration Adapter] WebSocket error:', error);
      triggerEvent('error', { error });
    };
  } catch (error) {
    console.error('[Integration Adapter] WebSocket connection error:', error);
  }
}

/**
 * Send a message to the Integration Engine WebSocket
 * 
 * @param data The data to send
 */
export function sendWebSocketMessage(data: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    console.warn('[Integration Adapter] WebSocket not connected');
  }
}

/**
 * Register an event listener for WebSocket events
 * 
 * @param event The event to listen for
 * @param callback The callback to execute when the event occurs
 */
export function onEvent(event: string, callback: (data: any) => void) {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  
  eventListeners[event].push(callback);
}

/**
 * Remove an event listener
 * 
 * @param event The event to remove the listener from
 * @param callback The callback to remove
 */
export function offEvent(event: string, callback: (data: any) => void) {
  if (eventListeners[event]) {
    eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
  }
}

/**
 * Trigger an event
 * 
 * @param event The event to trigger
 * @param data The data to pass to the listeners
 */
function triggerEvent(event: string, data: any) {
  if (eventListeners[event]) {
    eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Integration Adapter] Error in event listener for ${event}:`, error);
      }
    });
  }
}

/**
 * Register an integration node with the Integration Engine
 * 
 * @param data The registration data
 * @returns The registration response
 */
export async function registerIntegration(data: any) {
  try {
    // In development, we'll use the existing integration API
    // In production, we would use the separate Integration Engine
    return await apiRequest('/api/integration/register', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[Integration Adapter] Registration error:', error);
    throw error;
  }
}

/**
 * Get all registered integration endpoints
 * 
 * @returns The registered endpoints
 */
export async function getIntegrationEndpoints() {
  try {
    // In development, we'll use the existing integration API
    return await apiRequest('/api/integration/endpoints', {
      method: 'GET'
    });
  } catch (error) {
    console.error('[Integration Adapter] Get endpoints error:', error);
    throw error;
  }
}

/**
 * Make an outgoing API request through the Integration Engine
 * 
 * @param options The request options
 * @returns The API response
 */
export async function makeApiRequest(options: ApiRequestOptions) {
  try {
    // Format request body based on content type
    let formattedBody = options.body;
    const contentType = options.headers?.['Content-Type'] || 'application/json';
    
    if (typeof options.body === 'object' && contentType.includes('application/json')) {
      formattedBody = JSON.stringify(options.body);
    }
    
    // Create the request payload
    const requestPayload = {
      method: options.method,
      url: options.url,
      headers: options.headers || {},
      body: formattedBody,
      timeout: options.timeout || 30000,
      params: options.params || {}
    };
    
    // Make the request through our proxy endpoint
    // In development, we'll use the existing integration API
    const response = await apiRequest('/api/integration/request', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response;
  } catch (error) {
    console.error('[Integration Adapter] API request error:', error);
    throw error;
  }
}

/**
 * Run a workflow through the Integration Engine
 * 
 * @param workflowId The ID of the workflow to run
 * @param input The input data for the workflow
 * @returns The workflow execution response
 */
export async function runWorkflow(workflowId: number, input: any) {
  try {
    // In development, we'll use the existing API
    return await apiRequest('/api/integration/run-workflow', {
      method: 'POST',
      body: JSON.stringify({
        workflowId,
        input
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[Integration Adapter] Run workflow error:', error);
    throw error;
  }
}

/**
 * Get the URL for an integration endpoint
 * 
 * @param path The endpoint path
 * @returns The full URL for the endpoint
 */
export function getIntegrationUrl(path: string) {
  // In development, we'll use the existing API base URL
  const baseUrl = '/api/integration';
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/${normalizedPath}`;
}

// Initialize the adapter
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initIntegrationAdapter();
  });
}