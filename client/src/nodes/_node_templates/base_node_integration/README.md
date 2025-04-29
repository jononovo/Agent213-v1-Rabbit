# Base Integration Node Template

This template provides a starting point for creating integration nodes that connect with external services. Use this template for nodes that need to make API calls, handle webhooks, or register endpoints.

## Quick Start

1. Copy this entire folder to create your integration node:
   ```
   cp -r client/src/nodes/Base_nodes/base_node_integration client/src/nodes/Integration/[your_integration_node]
   ```

2. Update the following files:
   - **definition.ts**: Set `type`, `name`, `description`, and configure `integrationConfig`
   - **executor.ts**: Update interface and implement API integration logic
   - **ui.tsx**: Customize the configuration UI for your node
   - **tests.ts**: Modify tests to validate your node's integration
   - **index.ts**: No changes needed unless you add components

## Files Overview

### definition.ts
Defines the node's interface, appearance, and integration requirements.

- **Required changes:**
  - Change `type` to a unique identifier for your node
  - Update `name` and `description` for your integration
  - Configure input/output ports specific to your node
  - Set appropriate `category` and `icon`
  - Configure `integrationConfig` properties:
    - `provides`: What the node offers (endpoint, webhook, etc.)
    - `requires`: What the node needs (storage, authentication, etc.)
    - `endpoint`: Configuration for HTTP endpoints (if applicable)

### executor.ts
Contains the execution logic and API integration code.

- **Required changes:**
  - Update the data interface for your node's settings
  - Modify `defaultData` with appropriate defaults
  - Implement the API integration in `execute` function
  - Update `registerWithIntegrationEngine` if your node provides endpoints

### ui.tsx
Provides the configuration UI for your node.

- **Required changes:**
  - Customize UI components for your node's settings
  - Add validation for API credentials and endpoints
  - Implement handlers for user interaction

### tests.ts
Contains test cases to validate your integration.

- **Required changes:**
  - Update tests to match your node's behavior
  - Test API call success and failure scenarios
  - Test error handling for invalid credentials

### index.ts
Exports all components and registers with the Integration Engine.

- **Usually no changes needed**
- Updates only if you add or remove components

## Integration Types

The Integration Engine supports different integration patterns:

1. **API Client Nodes**: Connect to external APIs (like the Perplexity API)
2. **Webhook Receiver Nodes**: Receive callbacks from external services
3. **Endpoint Provider Nodes**: Expose endpoints for external systems
4. **Authentication Nodes**: Handle OAuth flows or API key management

## Best Practices

1. **Credentials**: Don't hardcode API keys; use environment variables
2. **Error Handling**: Gracefully handle API failures and rate limits
3. **Testing**: Create comprehensive tests for network failures
4. **Documentation**: Document the API requirements in your README
5. **Configuration**: Provide clear settings UI with validation

## Need Help?

If you have questions about creating integration nodes, refer to the complete documentation in README/INTEGRATION_ENGINE.md