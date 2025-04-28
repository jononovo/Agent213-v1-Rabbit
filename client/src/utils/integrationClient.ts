/**
 * Integration Client
 * 
 * Client-side utility for interacting with the Integration Engine.
 * This handles registration of integrations from the client/node side.
 */

// Simple logger function that doesn't break in browser
const log = (message: string, ...args: any[]) => {
  console.log(`[Integration] ${message}`, ...args);
};

// Types
interface EndpointConfig {
  methods: string[];
  workflowId?: number;
  nodeId?: string;
  description?: string;
}

/**
 * Client-side integration engine interface
 */
class IntegrationClient {
  private static instance: IntegrationClient;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  static getInstance(): IntegrationClient {
    if (!IntegrationClient.instance) {
      IntegrationClient.instance = new IntegrationClient();
    }
    return IntegrationClient.instance;
  }
  
  /**
   * Register an endpoint with the server-side integration engine
   */
  async registerEndpoint(path: string, config: EndpointConfig): Promise<string> {
    try {
      log(`Registering endpoint: ${path}`);
      
      const response = await fetch('/api/integration/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path, config })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register endpoint: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      log(`Endpoint registered successfully: ${data.path}`);
      return data.path;
    } catch (error) {
      console.error('Error registering integration endpoint:', error);
      // Return the path anyway to allow the UI to show something
      return path;
    }
  }
  
  /**
   * Get all registered integration endpoints
   */
  async getEndpoints(): Promise<{ path: string, config: EndpointConfig }[]> {
    try {
      const response = await fetch('/api/integration/endpoints');
      
      if (!response.ok) {
        throw new Error(`Failed to get endpoints: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.endpoints;
    } catch (error) {
      console.error('Error getting integration endpoints:', error);
      return [];
    }
  }
  
  /**
   * Generate a URL for a webhook endpoint
   */
  generateWebhookUrl(path: string): string {
    // Use window.location if available, otherwise fallback
    let baseUrl = '';
    
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const host = window.location.host;
      baseUrl = `${protocol}//${host}`;
    } else {
      baseUrl = '[YOUR-APPLICATION-URL]';
    }
    
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}/api/integration${normalizedPath}`;
  }
}

export const integrationClient = IntegrationClient.getInstance();