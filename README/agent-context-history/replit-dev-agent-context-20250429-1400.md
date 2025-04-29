# Replit Dev Agent Context Document

This document provides essential information about the Agent214 platform architecture, focusing on the Integration Engine implementation. This context enables AI assistants to effectively understand, explain, and modify the codebase.

## Technology Stack

- **Frontend**: React (18.x) + TypeScript + Vite
  - React Flow for node-based workflow visualization
  - Shadcn UI components for interface elements
  - TanStack Query for data fetching and state management
  - Wouter for client-side routing

- **Backend**: Express.js + TypeScript
  - Dedicated Integration Engine server for API and webhook management
  - Drizzle ORM for database operations
  - PostgreSQL for persistent storage
  - In-memory storage with Replit DB persistence for development
  - Zod for data validation and schema definition

- **API Integrations**:
  - Perplexity API (`llama-3.1-sonar-small-128k-online` model)
  - Claude API for natural language processing
  - HTTP request nodes for custom API integrations

## File Structure

The application follows a structured approach to organization:

```
/client/src/
├── components/        # Reusable UI components
├── lib/               # Shared utilities and services
│   └── nodeTestLoader.ts   # Dynamic test discovery system
├── nodes/             # Node definitions
│   ├── Integration/   # Integration nodes (special discovery)
│   │   ├── Webhooks/  # Webhook-related nodes
│   │   └── perplexity_api/  # Perplexity API integration
│   │       ├── definition.ts   # Node interface definition
│   │       ├── executor.ts     # Node execution logic
│   │       ├── ui.tsx          # Node configuration UI
│   │       ├── tests.ts        # Node-specific tests
│   │       └── index.ts        # Entry point
│   └── [Category]/   # Other node categories
├── pages/             # Application pages
│   └── node-debug/    # Node testing and debugging interface
├── utils/             # Utility functions
│   ├── integrationClient.ts    # Client for Integration Engine
│   └── integrationAdapter.ts   # Integration Engine adapter
└── types/             # TypeScript type definitions

/server/
├── integration/       # Integration Engine
│   ├── index.ts       # Server initialization
│   └── routes.ts      # API routes
├── routes.ts          # Main API routes
├── storage.ts         # Data storage implementation
└── index.ts           # Main server entry point

/shared/
├── schema.ts          # Shared data schemas
└── nodeTypes.ts       # Node type definitions
```

## Core Concepts

### 1. Integration Engine

A standalone Express server dedicated to handling webhook callbacks, API requests, and workflow execution. The Integration Engine allows nodes to operate independently from the main application.

```typescript
// Key files:
// server/integration/index.ts - Integration server setup
// server/integration/routes.ts - Integration API routes
// client/src/utils/integrationClient.ts - Client for interacting with Integration Engine
```

Key features:
- Path template matching for webhook endpoints
- Automatic node type discovery based on folder structure
- HTTP method routing for different API operations
- Workflow context preservation across requests

### 2. Node Architecture

Nodes are the building blocks of workflows and follow a standardized structure.

```typescript
// Integration Node structure
client/src/nodes/Integration/[Category]/[node_type]/
├── definition.ts      # Node definition with integrationConfig
├── executor.ts        # Execution logic with Integration Engine registration
├── ui.tsx             # Configuration UI
└── tests.ts           # Node-specific tests
```

Node definitions include:
- Type and metadata (name, description, category)
- Input/output port definitions
- Default configuration
- Integration capabilities (for Integration nodes)

### 3. Test Discovery System

The application uses dynamic test discovery to find and run tests for each node type:

```typescript
// client/src/lib/nodeTestLoader.ts
export const loadNodeTests = async (nodeType: string): Promise<NodeTest[] | null> => {
  // Dynamic import of test modules based on node type
  try {
    // Try to import from a specific category's tests
    const categoryTests = await importFromCategory(nodeType);
    if (categoryTests) return categoryTests;
    
    // Otherwise search all categories
    return await searchAllCategories(nodeType);
  } catch (error) {
    console.error(`Error loading tests for ${nodeType}:`, error);
    return null;
  }
};
```

Test files must export tests as the default export:
```typescript
// node/type/tests.ts
export default tests: NodeTest[];
```

### 4. Storage System

The application uses a flexible storage system with multiple implementation options:

```typescript
// server/storage.ts
export interface IStorage {
  // Database access
  db: Database;
  
  // CRUD methods for various entities
  getUsers(): Promise<User[]>;
  getAgents(): Promise<Agent[]>;
  getWorkflows(): Promise<Workflow[]>;
  // ...more methods
}
```

Current implementation:
- In-memory Map-based storage for development
- Replit Database for persistence between sessions
- PostgreSQL option for production environments

## Workflow Operations

### Integration Node Registration

Integration nodes register with the Integration Engine during execution:

```typescript
// Integration node registration flow
const registrationResult = await registerIntegration({
  nodeType: 'node_type_name',
  capabilities: {
    provides: {
      endpoint: true,
      webhook: true
    },
    endpoint: {
      pathTemplate: 'webhooks/:path',
      methods: ['POST', 'GET']
    }
  },
  workflowId,
  nodeId,
  description: 'Node description'
});
```

### API Request Handling

The Integration Engine processes API requests and routes them to the appropriate node:

```typescript
// Integration engine request handling
router.post('/integration/request', async (req, res) => {
  try {
    const { url, method, headers, data } = req.body;
    // Make external request and return response
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    const responseData = await response.json();
    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

### Webhook Triggering

Webhooks can trigger workflows through the Integration Engine:

```typescript
// Webhook handling
router.all('/integration/webhook/:id', async (req, res) => {
  const { id } = req.params;
  // Find registered endpoint
  const endpoint = registeredEndpoints.get(id);
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  
  // Trigger workflow
  await triggerWorkflow(endpoint.workflowId, endpoint.nodeId, {
    body: req.body,
    params: req.params,
    query: req.query,
    method: req.method
  });
  
  return res.status(200).json({ success: true });
});
```

## Common Development Patterns

### Creating a New Integration Node

1. **Create folder structure**:
   ```
   client/src/nodes/Integration/[Category]/[node_type]/
   ```

2. **Define node interface** in `definition.ts`:
   ```typescript
   export const definition: NodeDefinition = {
     type: 'your_node_type',
     name: 'Your Node Name',
     category: 'category',
     // ... other properties
     integrationConfig: {
       provides: {
         endpoint: false,
         webhook: false
       },
       // ... other capabilities
     }
   };
   ```

3. **Implement executor** in `executor.ts`:
   ```typescript
   export const execute = async (
     nodeData: YourNodeDataType,
     inputs?: any,
     context?: any
   ): Promise<NodeExecutionData> => {
     try {
       // Node execution logic
       return {
         items: [{ json: { result: 'success' } }],
         meta: {
           startTime: new Date(),
           endTime: new Date()
         }
       };
     } catch (error) {
       // Error handling
       return {
         items: [{ json: { error: error.message } }],
         meta: {
           error: true,
           errorMessage: error.message
         }
       };
     }
   };
   ```

4. **Create UI component** in `ui.tsx`:
   ```tsx
   export const component = ({ data, updateNodeData }) => {
     return (
       <div className="space-y-4">
         {/* Node configuration UI */}
       </div>
     );
   };
   ```

5. **Create tests** in `tests.ts`:
   ```typescript
   import { NodeTest } from '@/nodes/types/nodeTestsStandard';
   
   const tests: NodeTest[] = [
     {
       name: 'Basic functionality',
       description: 'Test basic node functionality',
       category: 'functionality',
       run: async () => {
         try {
           // Test implementation
           return { passed: true, message: 'Test passed' };
         } catch (error) {
           return { 
             passed: false, 
             message: `Test failed: ${error.message}` 
           };
         }
       }
     }
   ];
   
   export default tests;
   ```

6. **Create index.ts file** to export components:
   ```typescript
   import { definition } from './definition';
   import { component } from './ui';
   import { execute } from './executor';
   import tests from './tests';
   
   export { definition, component, execute, tests };
   export default { definition, component, execute, tests };
   ```

### Using the Integration Client

The Integration Client provides methods for interacting with the Integration Engine:

```typescript
import { 
  registerIntegration, 
  getIntegrationUrl,
  makeIntegrationRequest
} from '@utils/integrationClient';

// Register with integration engine
const result = await registerIntegration({
  nodeType: 'your_node_type',
  capabilities: { /* capabilities */ },
  workflowId,
  nodeId
});

// Generate endpoint URL
const url = getIntegrationUrl(result.path);

// Make API request through integration engine
const response = await makeIntegrationRequest({
  url: 'https://api.example.com/endpoint',
  method: 'POST',
  data: { key: 'value' }
});
```

## Update History

- **2025-04-29 14:00**: Initial comprehensive documentation of Integration Engine architecture
  - Added details on node test discovery system
  - Documented Perplexity API integration
  - Removed references to WebSocket functionality (removed from codebase)
  - Updated file structure to reflect current implementation
  - Added examples for creating Integration nodes with tests