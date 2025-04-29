/**
 * Integration Client
 * 
 * A client-side utility to communicate with the integration engine service.
 * This provides a clean interface for registering and managing integrations.
 */

import { apiRequest } from '../lib/queryClient';

// Integration capability type definitions
export interface IntegrationCapabilities {
  // What the node offers to the system
  provides?: {
    endpoint?: boolean;    // This node provides an HTTP endpoint
    webhook?: boolean;     // This node acts as a webhook receiver
    scheduler?: boolean;   // This node provides scheduling capabilities
  };
  
  // What the node needs from the system
  requires?: {
    storage?: boolean;       // Needs persistent storage for configuration
    authentication?: boolean; // Requires authentication
  };
  
  // Endpoint configuration (applicable when provides.endpoint=true)
  endpoint?: {
    pathTemplate?: string;   // URL path template
    methods?: string[];      // Supported HTTP methods
    authTypes?: string[];    // Supported auth methods
  };
}

// Integration node registration request
export interface IntegrationRegistrationRequest {
  nodeType: string;
  capabilities: IntegrationCapabilities;
  workflowId?: number;
  nodeId?: string;
  description?: string;
}

// Integration endpoint information
export interface EndpointInfo {
  path: string;
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  description?: string;
}

/**
 * Register a node as an integration with the Integration Engine
 * 
 * @param registrationData The registration data for the integration
 * @returns The registered endpoint information
 */
export async function registerIntegration(
  registrationData: IntegrationRegistrationRequest
): Promise<EndpointInfo> {
  try {
    const response = await apiRequest('/api/integration/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error registering integration:', error);
    throw error;
  }
}

/**
 * Unregister an integration endpoint
 * 
 * @param path The path of the endpoint to unregister
 * @returns Success status
 */
export async function unregisterIntegration(path: string): Promise<{ success: boolean }> {
  try {
    const response = await apiRequest('/api/integration/unregister', {
      method: 'POST',
      body: JSON.stringify({ path }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error unregistering integration:', error);
    throw error;
  }
}

/**
 * Get all registered integration endpoints
 * 
 * @returns Array of endpoint information
 */
export async function getIntegrationEndpoints(): Promise<EndpointInfo[]> {
  try {
    const response = await apiRequest('/api/integration/endpoints', {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching integration endpoints:', error);
    throw error;
  }
}

/**
 * Get the base URL for webhooks or API endpoints
 * 
 * @returns The base URL for constructing webhook or API endpoints
 */
export function getIntegrationBaseUrl(): string {
  // Default to current host if in browser
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/api/integration`;
  }
  
  // Fallback for non-browser environments (unlikely to be needed)
  return '/api/integration';
}

/**
 * Get the full URL for a specific integration endpoint
 * 
 * @param path The endpoint path
 * @returns The full URL for the endpoint
 */
export function getIntegrationUrl(path: string): string {
  const baseUrl = getIntegrationBaseUrl();
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/${normalizedPath}`;
}

/**
 * Parse a dynamic path template with variables
 * 
 * @param pathTemplate The path template with placeholders (e.g., 'webhooks/:path')
 * @param params The parameters to substitute in the template
 * @returns The parsed path
 */
export function parsePathTemplate(pathTemplate: string, params: Record<string, string>): string {
  let path = pathTemplate;
  
  // Replace each variable with its value
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  });
  
  return path;
}

/**
 * Interface for API request options
 */
export interface ApiRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  params?: Record<string, string>;
}

/**
 * Make an outgoing API request through the Integration Engine
 * 
 * This function handles external API requests, leveraging the Integration Engine's
 * proxy capabilities, error handling, and logging.
 * 
 * @param options The API request options
 * @returns The API response
 */
export async function makeApiRequest(options: ApiRequestOptions): Promise<any> {
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
    const response = await apiRequest('/api/integration/request', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}