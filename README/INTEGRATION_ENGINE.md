# Integration Engine Documentation

## Overview

The Integration Engine is a central service that manages external integrations like webhooks, API endpoints, and other external service connections. It allows integration nodes to autonomously register and handle external requests without requiring manual configuration or code changes.

## Core Concepts

### 1. Node-Based Integration Architecture

The Integration Engine follows a folder-based discovery approach with declarative capabilities:

- **Integration Folder Structure**: Integration nodes are placed in the `client/src/nodes/Integration/` directory
- **Automatic Registration**: Nodes in the Integration folder are automatically identified as integration points
- **Declarative Configuration**: Nodes declare their capabilities and requirements in their definition files

### 2. Integration Registry

The Integration Engine maintains a persistent registry of endpoints:

- **Lazy-Loading**: Handlers are only initialized when needed to minimize startup time
- **Persistent Storage**: Registry is stored in Replit Database to persist across restarts
- **Dynamic Updates**: Endpoints can be registered and unregistered at runtime

### 3. Node Type Handlers

Integration nodes can register specialized handlers for HTTP requests:

- **Path Templates**: Nodes define URL templates with parameter placeholders (e.g., `webhooks/:hookId`)
- **Parameter Extraction**: The engine extracts named parameters from incoming requests
- **Flexible Configuration**: Nodes can specify allowed HTTP methods, authentication requirements, etc.

## Architecture Components

### IntegrationEngine Class

The core service that manages the integration registry and handles requests:

```typescript
class IntegrationEngine {
  // Singleton instance
  private static instance: IntegrationEngine;
  
  // Registry storage
  private endpoints: Map<string, EndpointConfig>;
  private nodeTypeHandlers: Map<string, NodeTypeConfig>;
  private providers: Map<string, IntegrationProvider>;
  
  // Key methods
  async registerEndpoint(path: string, config: EndpointConfig): Promise<string>;
  async unregisterEndpoint(path: string): Promise<boolean>;
  async registerNodeType(nodeType: string, config: NodeTypeConfig): Promise<void>;
  async unregisterNodeType(nodeType: string): Promise<boolean>;
  async handleRequest(path: string, req: Request, res: Response): Promise<boolean>;
  private extractPathParams(template: string, path: string): Record<string, string>;
}
```

### Integration Node Structure

Integration nodes consist of three key files:

1. **definition.ts**: Declares node metadata and integration capabilities
2. **executor.ts**: Contains execution logic and integration registration
3. **ui.tsx**: Provides the node configuration UI

#### Example Node Definition

```typescript
const definition: NodeDefinition = {
  type: 'webhook_trigger_integration',
  name: 'Webhook Trigger (Integration)',
  category: 'triggers',
  
  // Integration-specific configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // This node provides an HTTP endpoint
      webhook: true       // This node acts as a webhook receiver
    },
    
    // What the node needs from the system
    requires: {
      storage: true       // Needs persistent storage for configuration
    },
    
    // Endpoint configuration
    endpoint: {
      pathTemplate: 'webhooks/:path',  // URL path template
      methods: ['POST', 'GET']         // Supported HTTP methods
    }
  }
};
```

### API Routes

The Integration Engine is integrated with the Express application through these routes:

- **`POST /api/integration/register`**: Register an integration endpoint
- **`POST /api/integration/register-node-type`**: Register a node type handler
- **`GET /api/integration/node-types`**: Get all registered node types
- **`GET /api/integration/endpoints`**: Get all registered endpoints
- **`ALL /api/integration/*`**: Handle integration requests

## Client-Side Integration

### Integration Client Utility

The `integrationClient.ts` utility provides client-side functions for registering and managing integrations:

```typescript
export async function registerIntegration(
  registrationData: IntegrationRegistrationRequest
): Promise<EndpointInfo>;

export async function unregisterIntegration(path: string): Promise<{ success: boolean }>;

export async function getIntegrationEndpoints(): Promise<EndpointInfo[]>;

export function getIntegrationBaseUrl(): string;

export function getIntegrationUrl(path: string): string;
```

## URL Path Handling

### Path Template Matching

The Integration Engine uses a two-step process for matching URLs to path templates:

1. **Quick Match Check**: `couldMatchPath` does a fast check to filter out obvious non-matches
2. **Parameter Extraction**: `extractPathParams` performs detailed matching and extracts parameters

### Parameter Extraction

Parameter extraction works by:

1. Normalizing paths (handling slashes consistently)
2. Splitting paths into segments
3. Comparing each segment with the template
4. Extracting named parameters (segments starting with `:`)

Example:
- Template: `/webhooks/:hookId/events/:eventType`
- URL: `/webhooks/1234/events/update`
- Result: `{ hookId: '1234', eventType: 'update' }`

## Security Considerations

- **Method Validation**: Requests are checked against allowed HTTP methods
- **Authentication**: Support for different authentication types (none, apiKey, bearer)
- **Error Handling**: Errors during request handling are properly caught and reported

## Testing and Debugging

The Integration Engine includes built-in testing tools:

- **test-integration-engine.ts**: A test script for verifying engine functionality
- **test-integration.sh**: A bash script for testing integration endpoints
- **API route**: `POST /api/test-integration-engine` for triggering tests

## Future Development

The Integration Engine is designed for extensibility:

- **Provider System**: Support for different integration providers (for MCP integration)
- **Authentication Expansion**: More authentication methods and validation
- **Enhanced Security**: Rate limiting, IP filtering, etc.
- **Persistence Improvements**: Better storage of integration configurations