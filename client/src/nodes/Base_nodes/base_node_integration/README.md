# Base Integration Node Template

This template provides a starting point for creating integration nodes that connect with external services and APIs. Integration nodes can provide webhooks, API endpoints, scheduled operations, or connections to external services.

## Quick Start

1. Copy this entire folder to create your integration node:
   ```
   cp -r client/src/nodes/Base_nodes/base_node_integration client/src/nodes/Integration/[Category]/[your_node_type]
   ```
   **Important**: Integration nodes must be placed in the `Integration` directory for proper discovery.

2. Update the following files:
   - **definition.ts**: Change `type`, `name`, `description`, and configure `integrationConfig`
   - **executor.ts**: Implement your integration logic
   - **ui.tsx**: Customize the configuration UI
   - **tests.ts**: Modify tests for your integration
   - **index.ts**: No changes needed unless you add/remove components

## Integration Node Requirements

### 1. Proper Location
Integration nodes must be placed in:
```
client/src/nodes/Integration/[Category]/[your_node_type]/
```

### 2. Integration Configuration
Your node definition must include an `integrationConfig` section:

```typescript
integrationConfig: {
  provides: {
    endpoint: boolean,  // Does it provide an HTTP endpoint?
    webhook: boolean,   // Does it act as a webhook receiver?
    scheduler: boolean, // Does it schedule operations?
    api: boolean        // Does it connect to an external API?
  },
  requires: {
    storage: boolean,      // Does it need persistent storage?
    authentication: boolean // Does it require authentication?
  },
  // If endpoint is true:
  endpoint?: {  
    pathTemplate: string,  // URL path pattern (e.g., 'webhooks/:path')
    methods: string[],     // Supported HTTP methods
    authTypes: string[]    // Supported auth methods
  }
}
```

### 3. Integration Registration
Integration nodes typically register with the Integration Engine in their execution:

```typescript
const registrationResult = await registerIntegration({
  nodeType: 'your_node_type',
  capabilities: {
    provides: {
      // Same as in integrationConfig
    }
  },
  workflowId: context.workflowId,
  nodeId: context.nodeId,
  description: 'Description of this integration instance'
});
```

## Common Integration Node Types

### 1. Webhook Trigger
Provides an HTTP endpoint that triggers workflows when called:
- Configure `provides.endpoint` and `provides.webhook` as `true`
- Use `pathTemplate` to define URL pattern
- Return webhook URL to workflow

### 2. API Consumer
Connects to an external API to fetch or send data:
- Configure `provides.api` as `true`
- If API needs authentication, set `requires.authentication` to `true`
- Use `makeIntegrationRequest()` to perform API calls

### 3. Scheduled Task
Performs operations on a schedule:
- Configure `provides.scheduler` as `true`
- Define schedule in node configuration
- Register schedule with Integration Engine

## Testing Your Integration Node

Integration nodes require specialized testing. The included test cases demonstrate how to test:

1. **API Functionality**: Making requests to external services
2. **Registration**: Proper registration with Integration Engine
3. **Error Handling**: Handling of API errors and connectivity issues
4. **Context Validation**: Proper validation of workflow context
5. **Authentication**: Proper handling of authentication requirements

## Best Practices

1. **Handle Credentials Securely**: Use environment variables for API keys
2. **Error Handling**: Implement robust error handling for API failures
3. **Rate Limiting**: Consider API rate limits in your implementation
4. **Polling**: For long-running operations, use polling with reasonable intervals
5. **Cross-Origin**: Consider CORS settings for webhook endpoints
6. **Timeouts**: Set appropriate timeouts for API requests

## Need Help?

If you have questions about creating integration nodes, refer to the complete documentation in README/step-by-step-guide-creating-new-nodes.md or check the Perplexity API node as a real-world example.