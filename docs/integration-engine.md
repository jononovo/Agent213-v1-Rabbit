# Integration Engine

The Integration Engine is a dedicated subsystem responsible for managing connections to external services, API endpoints, and webhooks. This document provides an overview of its architecture, capabilities, and integration with the platform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Integration Node Structure](#integration-node-structure)
  - [Capability Declaration](#capability-declaration)
  - [Engine Components](#engine-components)
- [Endpoint Management](#endpoint-management)
- [Authentication](#authentication)
- [API Request Proxy](#api-request-proxy)
- [Webhook Registration](#webhook-registration)
- [Development and Testing](#development-and-testing)

## Overview

The Integration Engine provides a unified framework for connecting to external services, managing API endpoints, and handling webhook callbacks. It runs as a separate server on port 3001, isolating integration concerns from the main application logic.

This design enables:

1. **Security**: Centralized authentication and API key management
2. **Monitoring**: Unified logging and analytics for external service interactions
3. **Throttling**: Rate limiting for external API calls
4. **Error Handling**: Standardized error handling and retry logic

## Architecture

### Integration Node Structure

Integration nodes are special node types that adhere to a structured format:

```
Integration/
  ├── [integration_name]/
  │   ├── definition.ts      # Node metadata and interface definitions
  │   ├── executor.ts        # Execution logic
  │   ├── capabilities.ts    # Integration capabilities declaration
  │   ├── tests.ts           # Integration-specific tests
  │   └── ui.tsx             # UI components (optional)
```

Each integration node defines its capabilities, requirements, and interaction patterns.

### Capability Declaration

Integration nodes declare their capabilities and requirements through a standardized interface:

```typescript
export interface IntegrationCapabilities {
  // What the integration provides
  provides: {
    endpoint?: boolean;      // Provides an API endpoint
    webhook?: boolean;       // Provides webhook functionality
    connector?: boolean;     // Connects to external service
    scheduler?: boolean;     // Provides scheduling capability
    ai?: boolean;            // Provides AI/ML capabilities
  };
  
  // What the integration requires
  requires: {
    storage?: boolean;       // Requires database storage
    authentication?: boolean; // Requires authentication
    proxy?: boolean;         // Requires API proxying
  };
  
  // External API configuration (if connector=true)
  externalApi?: {
    baseUrl: string;
    defaultEndpoint: string;
    authType: 'apiKey' | 'oauth2' | 'basic' | 'bearer';
    documentation: string;
  };
  
  // Endpoint configuration (if endpoint=true)
  endpoint?: {
    pathTemplate: string;
    methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
    authTypes: ('none' | 'apiKey' | 'bearer')[];
  };
  
  // Webhook configuration (if webhook=true)
  webhook?: {
    events: string[];
  };
}
```

### Engine Components

The Integration Engine consists of several key components:

1. **API Router**: Routes requests to the appropriate integration handlers
2. **Authentication Manager**: Handles authentication and credential storage
3. **Proxy Manager**: Manages outgoing API requests
4. **Webhook Manager**: Registers and manages incoming webhook endpoints
5. **Node Registry**: Tracks available integration nodes and their capabilities

## Endpoint Management

The Integration Engine dynamically creates endpoints based on integration node declarations:

```typescript
// Example endpoint registration in the Integration Engine
function registerEndpoints(app: Express) {
  const endpoints = getRegisteredEndpoints();
  
  for (const endpoint of endpoints) {
    const { path, methods, handler, auth } = endpoint;
    
    // Register middleware for authentication
    const authMiddleware = getAuthMiddleware(auth);
    
    // Register routes for each method
    for (const method of methods) {
      app[method.toLowerCase()](path, authMiddleware, async (req, res) => {
        try {
          await handler(req, res);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }
  }
}
```

## Authentication

The Integration Engine supports various authentication methods for both inbound and outbound requests:

1. **API Key**: Simple key-based authentication
2. **Bearer Token**: JWT or OAuth token-based authentication
3. **OAuth2**: Full OAuth2 flow with token refresh
4. **Basic Auth**: Username/password authentication

Authentication credentials are securely stored and managed by the engine.

## API Request Proxy

All outgoing API requests from integration nodes are proxied through a central endpoint:

```typescript
/**
 * Integration Engine API Request Proxy
 */
app.post('/api/integration/request', async (req: Request, res: Response) => {
  try {
    const { url, method, headers, body, nodeType, timeout } = req.body;
    
    // Validate request
    if (!url || !method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get integration capabilities to check if proxying is supported
    const capabilities = getIntegrationCapabilities(nodeType);
    if (!capabilities?.requires?.proxy) {
      return res.status(403).json({ error: 'This node type does not support API proxying' });
    }
    
    // Add authentication if needed
    const enhancedHeaders = enhanceWithAuth(headers, nodeType, url);
    
    // Make the outbound request
    const response = await fetch(url, {
      method,
      headers: enhancedHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: timeout ? AbortSignal.timeout(timeout) : undefined
    });
    
    // Get response data
    const responseData = await getResponseData(response);
    
    // Return the proxied response
    res.status(response.status).json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Webhook Registration

The Integration Engine provides dynamic webhook registration for integration nodes:

```typescript
/**
 * Register a webhook for a workflow node
 */
function registerWebhook(workflowId: number, nodeId: number, path: string): string {
  // Generate unique webhook ID
  const webhookId = uuidv4();
  
  // Store webhook mapping
  webhooks.set(webhookId, {
    workflowId,
    nodeId,
    path,
    created: new Date()
  });
  
  // Return full webhook URL
  return `/api/webhooks/${path}`;
}

/**
 * Handle incoming webhook requests
 */
async function handleWebhookRequest(
  req: Request,
  res: Response,
  path: string
): Promise<void> {
  // Find the matching webhook registration
  const webhook = Array.from(webhooks.values()).find(wh => wh.path === path);
  
  if (!webhook) {
    res.status(404).json({ error: 'Webhook not found' });
    return;
  }
  
  // Extract data from the webhook request
  const webhookData = {
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    params: req.params
  };
  
  // Trigger the associated workflow
  const result = await triggerWorkflow(webhook.workflowId, webhook.nodeId, webhookData);
  
  // Return appropriate response
  if (result.success) {
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
}
```

## Development and Testing

Testing integrations is facilitated through dedicated test scripts:

```typescript
/**
 * Test script for Integration Engine
 */
async function testIntegrationEngine() {
  console.log('Testing Integration Engine capabilities');
  
  // Step 1: Register a test integration node
  const registrationResponse = await fetch('http://localhost:3001/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'test_integration',
      name: 'Test Integration',
      version: '1.0.0',
      capabilities: {
        provides: {
          connector: true,
          webhook: true
        },
        requires: {
          proxy: true
        },
        externalApi: {
          baseUrl: 'https://jsonplaceholder.typicode.com',
          defaultEndpoint: '/posts',
          authType: 'none',
          documentation: 'https://jsonplaceholder.typicode.com'
        }
      }
    })
  });
  
  console.log('Registration response:', await registrationResponse.json());
  
  // Step 2: Test the API proxy capability
  const proxyResponse = await fetch('http://localhost:3001/api/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nodeType: 'test_integration',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET'
    })
  });
  
  console.log('Proxy response:', await proxyResponse.json());
  
  // Step 3: Test webhook registration
  const webhookResponse = await fetch('http://localhost:3001/api/register-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflowId: 1,
      nodeId: 1,
      path: 'test-webhook'
    })
  });
  
  console.log('Webhook registration response:', await webhookResponse.json());
}
```

This testing approach enables developers to validate integration functionality before deploying to production.