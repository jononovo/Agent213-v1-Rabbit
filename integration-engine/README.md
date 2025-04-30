# Integration Engine

The Integration Engine is a standalone server that manages external API integrations, webhooks, and API proxying. It runs on port 3001 and provides a clean separation of concerns for all external service communication.

## Migration Plan

The Integration Engine components should be migrated from `server/integration` and related files to this directory structure.

### Future Structure

```
integration-engine/
├── api/               # API proxying endpoints
├── connectors/        # External API connectors
├── webhooks/          # Webhook registration and routing
├── auth/              # API authentication handling
├── index.ts           # Integration Engine entry point
└── README.md          # This documentation file
```

### Migration Steps

1. **Move Core Files**:
   - Move `server/integration/index.ts` to `integration-engine/index.ts`
   - Move integration engine services to appropriate subdirectories

2. **Update Import Paths**:
   - Update all import paths to reference the new file locations
   - Create shared types in `shared/types` directory

3. **Setup Coordination**:
   - Update startup code in main server to start the Integration Engine

## Integration Engine Capabilities

The Integration Engine provides:

1. **API Proxying**: Routes API requests through a single endpoint for security and monitoring
2. **Authentication Management**: Handles authentication to external services
3. **Endpoint Registration**: Manages webhook endpoints and callbacks
4. **Service Connectors**: Provides standardized interfaces to external APIs

## Integration Architecture

The Integration Engine exposes a standardized interface for all integration nodes:

```typescript
interface IntegrationCapabilities {
  provides: {
    endpoint?: boolean;
    webhook?: boolean;
    connector?: boolean;
    scheduler?: boolean;
    ai?: boolean;
  };
  requires: {
    storage?: boolean;
    authentication?: boolean;
    proxy?: boolean;
  };
}
```

Integration nodes communicate with the Integration Engine via a well-defined API to register capabilities, endpoints, and webhooks.