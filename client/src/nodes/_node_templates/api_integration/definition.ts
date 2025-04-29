/**
 * API Integration Node Definition
 * 
 * This node provides a standard interface for making external API requests.
 * It's a key component of the Integration Engine system, allowing workflows to
 * interact with external APIs.
 */

// We're using a simplified interface here for the template
// In a real implementation, import from the correct path
interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  defaultData: any;
  integrationConfig?: {
    provides: string[];
    requires: string[];
  };
  inputs: Record<string, {
    type: string;
    description: string;
  }>;
  outputs: Record<string, {
    type: string;
    description: string;
  }>;
}

// Define the structure of node data
export interface ApiIntegrationData {
  label: string;
  description: string;
  url: string;               // API endpoint URL
  method: string;            // HTTP method (GET, POST, etc.)
  headers: Record<string, string>; // HTTP headers
  body?: string | object;    // Request body (for POST, PUT, etc.)
  useProxy: boolean;         // Whether to use the Integration Engine proxy
  timeout: number;           // Request timeout in milliseconds
  retries: number;           // Number of retries on failure
  usePagination: boolean;    // Whether to handle pagination
  paginationStrategy?: string; // Pagination strategy (offset, cursor, etc.)
  authType?: string;         // Authentication type (none, basic, oauth, etc.)
  authConfig?: Record<string, any>; // Authentication configuration
}

// Default data for this node type
export const defaultData: ApiIntegrationData = {
  label: 'API Request',
  description: 'Makes external API requests',
  url: 'https://api.example.com',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  useProxy: true,
  timeout: 30000,
  retries: 3,
  usePagination: false
};

// Node definition for registration in the node registry
export const definition: NodeDefinition = {
  type: 'api_integration',
  name: 'API Request',
  description: 'Makes external API requests through the Integration Engine',
  category: 'integration',
  defaultData,
  
  // Integration nodes have special integration configuration
  integrationConfig: {
    // This node provides an API client
    provides: ['api_client'],
    // This node requires the Integration Engine request proxy
    requires: ['integration_proxy']
  },
  
  // Input ports
  inputs: {
    url: {
      type: 'string',
      description: 'API endpoint URL (overrides configured URL)'
    },
    headers: {
      type: 'object',
      description: 'Additional HTTP headers to include in the request'
    },
    body: {
      type: 'any',
      description: 'Request body for POST, PUT, etc.'
    },
    params: {
      type: 'object',
      description: 'URL query parameters'
    }
  },
  
  // Output ports
  outputs: {
    response: {
      type: 'object',
      description: 'The API response data'
    },
    status: {
      type: 'number',
      description: 'HTTP status code'
    },
    headers: {
      type: 'object',
      description: 'Response headers'
    },
    error: {
      type: 'object',
      description: 'Error details (if any)'
    }
  }
};