# Technical Documentation: Webhook Migration from Workflow Execution to Integration Engine

## I. Current Implementation Status

### A. Migration of Webhook Handling Components

We've successfully migrated the webhook handling code from the Workflow Execution Server to the Integration Engine, conforming to the three-server architecture principle of proper separation of concerns:

1. **Integration Engine Webhook Implementation** (Created):
   - `integration-engine/webhooks/webhookController.ts`: Implements the `handleWebhookRequest` function that processes incoming webhook requests, extracts relevant parameters, and forwards execution requests to the Workflow Execution Server.
   - `integration-engine/webhooks/webhookHandler.ts`: Implements a stateful pending response management system with timeout handling via the `registerPendingResponse` and `sendWebhookResponse` functions.
   - Integration Engine router paths in `integration-engine/index.ts`: Added endpoint declarations for `/webhooks/:path`, `/webhooks/workflow/:workflowId/node/:nodeId`, and `/webhook-response`.

2. **Main Server Webhook Forwarding** (Modified):
   - `server/routes.ts`: Updated webhook route handlers to forward requests to the Integration Engine.
   - Implemented `forwardWebhookToIntegrationEngine`: A proxy function that handles communication between the Main Server and Integration Engine.
   - Refactored `handleWebhookRequest`: Now a thin wrapper around the forwarding function, maintaining API compatibility.

3. **Workflow Execution Server** (Deprecated):
   - `workflow-execution/webhooks/webhookController.ts`: Added deprecation notices.
   - `workflow-execution/webhooks/webhookHandler.ts`: Added deprecation notices.

### B. Technical Flow Implementation

The current implementation establishes the following technical flow:

1. Main Server (`server/routes.ts`) receives webhook request at `/api/webhooks/:path` or `/api/webhooks/workflow/:workflowId/node/:nodeId`.
2. Request is processed by `forwardWebhookToIntegrationEngine` function.
3. Integration Engine (`integration-engine/webhooks/webhookController.ts`) registers the pending response and forwards execution to Workflow Execution Server.
4. Workflow Execution Server processes the workflow and communicates results back to Integration Engine.
5. Integration Engine sends response to the original webhook caller.

### C. Type-Safety and Error Handling

1. Implemented type-safe interfaces in `shared/types/integration.ts`: 
   - `WebhookRequest`
   - `WebhookExecutionResult`
   - `PendingWebhookResponse`

2. Added comprehensive error handling:
   - Timeout handling for webhook responses
   - Type checking for API responses
   - Graceful fallbacks for failed operations
   - HTTP status code mapping

## II. Remaining Technical Tasks

### A. Server Startup and Process Management

1. **ES Module Compatibility Issues**:
   - Current issue: `require.main` checks are incompatible with ES modules in `integration-engine/index.ts` and potentially in other files.
   - Solution: Refactor to use `import.meta.url` approach for module detection:
     ```typescript
     const isMainModule = import.meta.url.endsWith(process.argv[1]);
     if (isMainModule) {
       // Start server
     }
     ```

2. **Process Management**:
   - Implement a proper multi-process management system using either:
     - Node.js cluster module for single-machine deployment
     - PM2 process management for production deployments
     - Docker Compose for containerized deployment
   - Server communication health checks via `/health` endpoints

3. **Inter-Server Communication**:
   - Implement retry logic for server-to-server communication
   - Circuit breaker pattern for handling temporary server unavailability
   - Connection pooling for high-performance scenarios

### B. Testing Requirements

1. **Unit Tests**:
   - Test `webhookController.ts` in isolation with mocked dependencies
   - Test `webhookHandler.ts` timeout behavior
   - Test serialization/deserialization of webhook payloads

2. **Integration Tests**:
   ```typescript
   // Test case: Webhook forwarding from Main to Integration Engine
   it('should forward webhook from main server to integration engine', async () => {
     // Setup test webhook server
     const mockWebhookReceiver = createMockServer();
     
     // Send webhook to main server
     const response = await fetch('http://localhost:5000/api/webhooks/test-path', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ test: 'data' })
     });
     
     // Verify request was forwarded to integration engine
     expect(integrationEngineRequestLog).to.include('/api/webhooks/test-path');
     expect(response.status).to.equal(200);
   });
   
   // Test case: End-to-end webhook flow
   it('should process webhook through all three servers', async () => {
     // Setup test data
     const workflowId = 1;
     const nodeId = 'webhook-trigger-1';
     const testPayload = { query: 'test', searchId: 'test-1' };
     
     // Send webhook to main server
     const response = await fetch(`http://localhost:5000/api/webhooks/workflow/${workflowId}/node/${nodeId}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(testPayload)
     });
     
     // Verify full processing chain
     expect(response.status).to.equal(200);
     
     // Check logs were created
     const logs = await getWorkflowLogs(workflowId);
     expect(logs.length).to.be.greaterThan(0);
     expect(logs[0].status).to.equal('completed');
   });
   ```

3. **Load Tests**:
   - Test webhook processing under concurrent load (100+ simultaneous requests)
   - Measure latency across the three-server architecture
   - Identify potential bottlenecks in the forwarding process

4. **Fault Tolerance Tests**:
   - Test behavior when Integration Engine is down
   - Test behavior when Workflow Execution Server is down
   - Test recovery after server restarts

### C. Anticipated Technical Issues and Solutions

1. **Cross-Server Error Propagation**:
   - Issue: Error information might be lost across server boundaries
   - Solution: Implement standardized error objects with preservation of stack traces and context
   ```typescript
   interface SystemError {
     code: string;
     message: string;
     source: 'main-server' | 'integration-engine' | 'workflow-execution';
     timestamp: string;
     originalError?: any;
     context?: Record<string, any>;
   }
   ```

2. **Webhook Timeout Race Conditions**:
   - Issue: Race conditions may occur when a workflow completes near timeout boundary
   - Solution: Implement distributed locking mechanism for pending responses
   ```typescript
   class DistributedResponseLock {
     async acquireLock(requestId: string): Promise<boolean> {
       // Implementation using Redis or similar
     }
     
     async releaseLock(requestId: string): Promise<void> {
       // Implementation
     }
   }
   ```

3. **Server Restart Data Persistence**:
   - Issue: Pending webhook responses lost on server restart
   - Solution: Implement persistent storage for pending responses
   ```typescript
   interface PersistentWebhookResponseStore {
     save(requestId: string, data: PendingWebhookResponse): Promise<void>;
     load(requestId: string): Promise<PendingWebhookResponse | null>;
     delete(requestId: string): Promise<void>;
     getAll(): Promise<Map<string, PendingWebhookResponse>>;
   }
   ```

4. **TypeScript Module Resolution**:
   - Issue: Import paths between servers causing resolution issues
   - Solution: Create standardized path aliases in tsconfig.json
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@main/*": ["./server/*"],
         "@integration/*": ["./integration-engine/*"],
         "@workflow/*": ["./workflow-execution/*"],
         "@shared/*": ["./shared/*"]
       }
     }
   }
   ```

## III. Implementation Plan for Completion

### Phase 1: Stabilize Current Migration

1. Fix TypeScript and ESM compatibility issues:
   - Update module import/export patterns across all files
   - Standardize error handling between servers
   - Create consistent type definitions in shared directory

2. Implement test suite focusing on:
   - Webhook forwarding from Main to Integration Engine
   - End-to-end webhook processing
   - Error handling and timeouts

3. Refine API contracts between servers:
   ```typescript
   // In shared/types/integration.ts
   export interface WebhookForwardingRequest {
     workflowId: number;
     nodeId: string;
     payload: any;
     headers: Record<string, string | string[] | undefined>;
     method: string;
     query: Record<string, any>;
     params: Record<string, any>;
     path: string;
     requestId: string;
   }
   
   // In shared/types/workflow.ts
   export interface WorkflowExecutionRequest {
     workflowId: number;
     input: any;
     nodeId?: string;
     webhookRequestId?: string;
     executionOptions?: {
       timeout?: number;
       includeDetail?: boolean;
       debug?: boolean;
     }
   }
   ```

### Phase 2: Server Management Implementation

1. Create unified server startup mechanism:
   ```typescript
   // In start-servers.ts
   import { startMainServer } from './server/index';
   import { startIntegrationEngine } from './integration-engine/index';
   import { startWorkflowExecution } from './workflow-execution/index';
   
   async function startAllServers() {
     try {
       // Start servers in correct dependency order
       console.log('Starting Workflow Execution Server...');
       const workflowServer = await startWorkflowExecution();
       
       console.log('Starting Integration Engine...');
       const integrationEngine = await startIntegrationEngine();
       
       console.log('Starting Main Server...');
       const mainServer = await startMainServer();
       
       // Add shutdown handlers
       process.on('SIGINT', async () => {
         console.log('Shutting down servers...');
         await Promise.all([
           new Promise(resolve => mainServer.close(resolve)),
           new Promise(resolve => integrationEngine.close(resolve)),
           new Promise(resolve => workflowServer.close(resolve))
         ]);
         process.exit(0);
       });
       
       console.log('All servers started successfully');
     } catch (error) {
       console.error('Error starting servers:', error);
       process.exit(1);
     }
   }
   
   startAllServers();
   ```

2. Implement health check system across all servers:
   ```typescript
   // In shared/health.ts
   export async function checkServerHealth(url: string): Promise<boolean> {
     try {
       const response = await fetch(`${url}/health`);
       return response.status === 200;
     } catch (error) {
       return false;
     }
   }
   
   export async function waitForServerReady(url: string, maxAttempts = 10): Promise<boolean> {
     for (let i = 0; i < maxAttempts; i++) {
       if (await checkServerHealth(url)) {
         return true;
       }
       await new Promise(resolve => setTimeout(resolve, 1000));
     }
     return false;
   }
   ```

### Phase 3: Webhook System Hardening

1. Implement persistent storage for pending webhook responses:
   ```typescript
   // In integration-engine/webhooks/persistentStore.ts
   import { PendingWebhookResponse } from '../../shared/types/integration';
   import { db } from '../storage';
   
   export class PersistentWebhookStore {
     async saveResponse(requestId: string, data: PendingWebhookResponse): Promise<void> {
       await db.set(`webhook:${requestId}`, JSON.stringify({
         ...data,
         // Convert non-serializable components
         res: null, // Cannot store response object
         timeoutId: null // Cannot store timeout reference
       }));
     }
     
     async loadResponses(): Promise<Map<string, Partial<PendingWebhookResponse>>> {
       const keys = await db.list('webhook:');
       const responses = new Map<string, Partial<PendingWebhookResponse>>();
       
       for (const key of keys) {
         const requestId = key.replace('webhook:', '');
         const data = JSON.parse(await db.get(key) || '{}');
         responses.set(requestId, data);
       }
       
       return responses;
     }
     
     async removeResponse(requestId: string): Promise<void> {
       await db.delete(`webhook:${requestId}`);
     }
   }
   ```

2. Enhance webhook timeout handling:
   ```typescript
   // In integration-engine/webhooks/webhookHandler.ts
   
   // Advanced timeout management with escalation
   export function registerPendingResponse(
     requestId: string, 
     res: Response, 
     workflowId: number,
     options: {
       timeoutMs?: number;
       escalationThreshold?: number;
       maxRetries?: number;
     } = {}
   ): void {
     const {
       timeoutMs = DEFAULT_TIMEOUT,
       escalationThreshold = timeoutMs * 0.8,
       maxRetries = 1
     } = options;
     
     // First timeout - escalation warning
     const escalationTimeout = setTimeout(() => {
       console.warn(`[Integration Engine] Webhook ${requestId} approaching timeout (${timeoutMs}ms). Escalating priority.`);
       
       // Check workflow status and potentially escalate
       checkWorkflowStatus(workflowId, requestId);
     }, escalationThreshold);
     
     // Final timeout - auto-response
     const finalTimeout = setTimeout(() => {
       if (pendingResponses.has(requestId)) {
         const { res } = pendingResponses.get(requestId)!;
         
         if (!res.headersSent) {
           res.status(202).json({
             success: true,
             message: "Webhook received and processing started, but no explicit response was sent within the timeout period",
             requestId
           });
         }
         
         clearTimeout(escalationTimeout);
         pendingResponses.delete(requestId);
         persistentStore.removeResponse(requestId).catch(console.error);
         console.log(`[Integration Engine] Auto-response sent for webhook ${requestId} (timeout reached)`);
       }
     }, timeoutMs);
     
     // Store both timeout references
     pendingResponses.set(requestId, { 
       res, 
       timeout: finalTimeout,
       workflowId,
       escalationTimeout
     });
     
     // Persist for recovery
     persistentStore.saveResponse(requestId, { workflowId }).catch(console.error);
     
     console.log(`[Integration Engine] Registered pending response for requestId ${requestId} (workflow ${workflowId})`);
   }
   ```

## IV. Technical Conclusion

The migration of webhook handling from the Workflow Execution Server to the Integration Engine has been substantially implemented. The design aligns with the three-server architecture principles and establishes clear separation of concerns between the servers.

To complete the migration, we need to focus on:

1. Resolving ES module compatibility issues in server startup
2. Implementing robust server coordination with health checks
3. Creating comprehensive testing for webhook flows
4. Enhancing error handling and timeout management
5. Adding persistent storage for pending responses

The proposed technical solutions address all identified issues and provide a clear roadmap for completion. Upon finalizing these tasks, the webhook system will be fully migrated to the Integration Engine, establishing a maintainable pattern for future feature development.