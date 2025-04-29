/**
 * Integration Client
 * 
 * This utility provides functions for nodes to interact with the Integration Engine.
 * It handles registration, API requests, and endpoint management.
 */

// Types for integration registration
export interface IntegrationCapabilities {
  provides: {
    endpoint?: boolean;
    webhook?: boolean;
    scheduler?: boolean;
    api?: boolean;
  };
}

export interface RegisterIntegrationParams {
  nodeType: string;
  capabilities: IntegrationCapabilities;
  workflowId: number;
  nodeId: string | number;
  description?: string;
  config?: Record<string, any>;
}

export interface RegisterIntegrationResponse {
  id: string;
  endpoint?: string;
  capabilities: IntegrationCapabilities;
  registered: boolean;
  timestamp: string;
}

// Types for integration requests
export interface IntegrationRequestOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  useAuth?: boolean;
}

/**
 * Register an integration with the Integration Engine
 * 
 * This registers a node as an integration provider or consumer,
 * which allows it to receive webhooks, provide endpoints, or access external APIs.
 * 
 * @param params Registration parameters
 * @returns Registration result with endpoint information if applicable
 */
export async function registerIntegration(
  params: RegisterIntegrationParams
): Promise<RegisterIntegrationResponse> {
  try {
    const response = await fetch('/api/integration/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register integration: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering integration:', error);
    throw error;
  }
}

/**
 * Make an authenticated request through the Integration Engine
 * 
 * This sends an API request through the Integration Engine, which handles:
 * - Adding authentication headers (API keys)
 * - Error handling
 * - Rate limiting
 * - Logging
 * 
 * @param options Request options
 * @returns API response
 */
export async function makeIntegrationRequest(
  options: IntegrationRequestOptions
): Promise<any> {
  try {
    const response = await fetch('/api/integration/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Integration request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error making integration request:', error);
    throw error;
  }
}

/**
 * Get information about registered integrations
 * 
 * @param workflowId Optional workflow ID to filter by
 * @param nodeId Optional node ID to filter by
 * @returns List of registered integrations
 */
export async function getIntegrations(
  workflowId?: number,
  nodeId?: string | number
): Promise<RegisterIntegrationResponse[]> {
  try {
    let url = '/api/integration/endpoints';
    const params = new URLSearchParams();
    
    if (workflowId !== undefined) {
      params.append('workflowId', workflowId.toString());
    }
    
    if (nodeId !== undefined) {
      params.append('nodeId', nodeId.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get integrations: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting integrations:', error);
    throw error;
  }
}

/**
 * Get integration node types
 * 
 * @returns List of available integration node types
 */
export async function getIntegrationNodeTypes(): Promise<string[]> {
  try {
    const response = await fetch('/api/integration/node-types');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get integration node types: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting integration node types:', error);
    throw error;
  }
}

/**
 * Build a webhook URL for an integration node
 * 
 * @param workflowId Workflow ID
 * @param nodeId Node ID
 * @returns Full webhook URL
 */
export function buildWebhookUrl(workflowId: number, nodeId: string | number): string {
  // Get the base URL from the current window location
  const protocol = window.location.protocol;
  const host = window.location.host;
  
  // Construct the webhook URL
  return `${protocol}//${host}/api/webhooks/workflow/${workflowId}/node/${nodeId}`;
}

/**
 * Build a dynamic endpoint URL for an integration node
 * 
 * @param pathTemplate Path template string (e.g., 'webhooks/:path')
 * @param params Parameters to replace in the template
 * @returns Full endpoint URL
 */
export function buildEndpointUrl(pathTemplate: string, params: Record<string, string>): string {
  // Get the base URL from the current window location
  const protocol = window.location.protocol;
  const host = window.location.host;
  
  // Replace parameters in the path template
  let path = pathTemplate;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  
  // Construct the full URL
  return `${protocol}//${host}/api/${path}`;
}