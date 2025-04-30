# Replit Dev Agent Context Document

This document provides essential information about the Agent217 platform architecture, focusing on the Workflow Execution Engine, Integration Engine, and enhanced Node Testing System. This context enables AI assistants to effectively understand, explain, and modify the codebase.

## Technology Stack

- **Frontend**: React (18.x) + TypeScript + Vite
  - React Flow for node-based workflow visualization
  - Shadcn UI components for interface elements
  - TanStack Query for data fetching and state management
  - Wouter for client-side routing

- **Backend**: Express.js + TypeScript
  - Workflow Execution Server for isolated workflow processing
  - Integration Engine server for API and webhook management
  - Drizzle ORM for database operations
  - PostgreSQL for persistent storage
  - In-memory storage with Replit DB persistence for development
  - Zod for data validation and schema definition

- **API Integrations**:
  - Perplexity API (`llama-3.1-sonar-small-128k-online` model)
  - Claude API for natural language processing
  - HTTP request nodes for custom API integrations

## Architecture Overview

The platform is built around a modular node-based workflow architecture with three key server components:

1. **Main Application Server** (Port 5000)
   - Serves the frontend application
   - Handles user authentication and permissions
   - Manages workflow and node configuration
   - Stores execution logs and results
   - Proxies requests to specialized servers

2. **Workflow Execution Server** (Port 3002)
   - Executes workflows in isolation
   - Prevents workflow errors from affecting the main application
   - Provides job queuing and status tracking
   - Returns execution results to the main server

3. **Integration Engine Server** (Port 3001)
   - Manages connections to external services
   - Handles API authentication and proxying
   - Registers and manages webhook endpoints
   - Standardizes integration patterns

## File Structure

The application follows a structured approach to organization:

```
/client/src/
├── components/        # Reusable UI components (non-node specific)
│   └── flow/          # Flow editor related components
│       ├── FlowEditor.tsx
│       ├── NodeSettingsDrawer.tsx
│       └── ...
├── lib/               # Shared utilities and services
│   ├── nodeTestLoader.ts          # Dynamic test discovery system
│   └── unifiedNodeRegistry.ts     # Central node registry
├── nodes/             # Node definitions and components
│   ├── Base/          # BaseNode implementation
│   │   ├── definition.ts
│   │   ├── ui.tsx     # Enhanced BaseNode component
│   │   └── index.ts
│   │
│   ├── components/    # Shared node UI components
│   │   ├── base/      # Base node UI building blocks
│   │   │   ├── NodeContainer.tsx
│   │   │   ├── NodeHeader.tsx
│   │   │   ├── NodeContent.tsx
│   │   │   ├── NodeHoverMenu.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── custom_node_ui/   # Shared custom UI elements
│   │       ├── handle_with_label.tsx
│   │       ├── input_select.tsx
│   │       └── ...
│   │
│   ├── System/        # Core system nodes
│   │   ├── function_node/
│   │   └── ...
│   │
│   ├── Integration/   # Integration nodes (special discovery)
│   │   ├── webhook_trigger/  # Webhook-related nodes
│   │   └── perplexity_api/  # Perplexity API integration
│   │       ├── definition.ts   # Node interface definition
│   │       ├── executor.ts     # Node execution logic
│   │       ├── ui.tsx          # Node configuration UI
│   │       ├── tests.ts        # Node-specific tests
│   │       └── index.ts        # Entry point
│   │
│   ├── Custom/        # Application-specific custom nodes
│   │
│   ├── Agents/        # Agent-specific nodes
│   │
│   ├── _node_templates/  # Templates for new nodes
│   │   ├── base_node_template/
│   │   ├── api_integration/
│   │   ├── output_node/
│   │   ├── processing_node/
│   │   └── webhook_integration/
│   │
│   └── CONTEXT.md     # Documentation for node system
│
├── pages/             # Application pages
│   └── node-debug/    # Node testing and debugging interface
│       ├── components/    # Node debug UI components
│       │   ├── TestResultsPanel.tsx # Visualizes test results
│       │   └── ...
│       ├── utils/         # Debug utilities
│       │   ├── testRunner.ts       # Test execution logic 
│       │   ├── standardTests.ts    # Standard node tests
│       │   └── ...
│       └── index.tsx      # Main node debug page
├── utils/             # Utility functions
│   ├── integrationClient.ts    # Client for Integration Engine
│   └── integrationAdapter.ts   # Integration Engine adapter
└── types/             # TypeScript type definitions

/server/
├── integration/       # Integration Engine
│   ├── index.ts       # Server initialization
│   └── routes.ts      # API routes
├── workflow-execution/ # Workflow Execution Engine
│   ├── index.ts       # Server initialization
│   ├── simpleQueue.ts # Queue for workflow jobs
│   └── workflowEngine.ts # Core workflow execution logic
├── routes.ts          # Main API routes
├── storage.ts         # Data storage implementation
├── node-debug.ts      # Node debug API endpoints
└── index.ts           # Main server entry point

/shared/
├── schema.ts          # Shared data schemas
└── nodeTypes.ts       # Node type definitions

/docs/
├── DOCUMENTATION.md   # Comprehensive platform documentation
├── ultra-simple-node-creation.md  # Node creation guide
├── node_creation_checklist.md     # Detailed node creation steps
└── INTEGRATION_ENGINE.md          # Integration Engine documentation
```

## Core Concepts

### 1. Workflow Execution Engine

The Workflow Execution Engine is a dedicated subsystem that safely executes workflows in isolation from the main application:

```typescript
// Key files:
// server/workflow-execution/index.ts - Execution server setup
// server/workflow-execution/simpleQueue.ts - Job queue implementation
// server/workflow-execution/workflowEngine.ts - Execution logic
```

Key features:

1. **Isolation**: Prevents workflow execution errors from affecting the main application
2. **Job Queue**: Manages workflow execution requests with a simple queue system:
   ```typescript
   class SimpleQueue {
     private queue: Record<string, WorkflowJob> = {};
     private timeouts: Record<string, NodeJS.Timeout> = {};
     
     // Queue management methods
     enqueue(job: WorkflowJob): string
     getJob(jobId: string): WorkflowJob | undefined
     startJob(jobId: string): boolean
     completeJob(jobId: string, result: any): void
     failJob(jobId: string, error: any): void
   }
   ```

3. **API Endpoints**:
   - `POST /api/workflow-execution/execute` - Trigger workflow execution
   - `GET /api/workflow-execution/status/:jobId` - Get execution status

4. **Error Handling**: Sophisticated error tracking and timeout management
5. **Status Tracking**: Real-time status updates for running workflows

### 2. Node Testing Framework

The Node Testing Framework provides a comprehensive system for testing and validating nodes:

```typescript
// Key files:
// client/src/pages/node-debug/index.tsx - Debug interface
// client/src/pages/node-debug/utils/testRunner.ts - Test execution
// client/src/pages/node-debug/utils/standardTests.ts - Standard tests
// client/src/lib/nodeTestLoader.ts - Dynamic test discovery
```

The framework includes three types of tests:

1. **Standard Tests**: Basic tests that all nodes must pass
   - File Structure Test
   - Export Validation Test
   - Metadata Completeness Test
   - Port Definition Test
   - Executor Signature Test
   - Output Format Test
   - Error Handling Test

2. **Integration Tests**: Tests for nodes implementing external service integrations
   - Integration Capabilities Test
   - Integration Requirements Test

3. **Custom Tests**: Node-specific tests defined in a node's `tests.ts` file

Test Discovery System:
```typescript
// Dynamic test discovery
export const loadNodeTests = async (nodeType: string): Promise<NodeTest[] | null> => {
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

### 3. BaseNode Customization System

The `BaseNode` component provides a comprehensive customization system that allows for rich, unique node UIs while maintaining standardized behavior:

```typescript
// Key files:
// client/src/nodes/Base/ui.tsx - BaseNode component implementation
// client/src/nodes/components/base/ - Core UI building blocks
// client/src/nodes/components/custom_node_ui/ - Shared custom components
```

Key customization options:

```typescript
// BaseNode customization properties
interface BaseNodeData {
  // Content customization
  childrenContent?: React.ReactNode;        // Main custom content
  customHeaderContent?: React.ReactNode;    // Content above main content
  customFooterContent?: React.ReactNode;    // Content below main content
  fullCustomContent?: boolean;              // Bypass standard layout
  
  // Handle customization
  customHandles?: React.ReactNode;          // Custom connection points
  hideDefaultHandles?: boolean;             // Hide standard handles
  
  // Visual customization
  icon?: string | React.ReactNode;          // Custom icon
  
  // Status indicators
  isProcessing?: boolean;                   // Node is running
  isComplete?: boolean;                     // Node completed execution
  hasError?: boolean;                       // Node encountered error
  errorMessage?: string;                    // Error details
  
  // Node notes
  note?: string;                            // Note content
  showNote?: boolean;                       // Show note on node
}
```

### 4. Component Organization

UI components are organized according to clear guidelines:

1. **Base Components** (`/client/src/nodes/components/base/`):
   - Fundamental building blocks used by all nodes
   - Provide consistent styling and behavior
   - Only modified for system-wide changes

2. **Custom Node UI Components** (`/client/src/nodes/components/custom_node_ui/`):
   - Reusable components shared across multiple node types
   - Standardized controls like handles with labels, inputs, etc.
   - Used for common node UI patterns

3. **Node-Specific Components** (`/nodes/[Category]/[node_name]/components/`):
   - Components used by only one specific node
   - Custom visualizations or specialized controls
   - Kept encapsulated within the node's folder

### 5. Integration Engine

A standalone Express server dedicated to handling webhook callbacks, API requests, and external service integrations:

```typescript
// Key files:
// server/integration/index.ts - Integration server setup
// server/integration/routes.ts - Integration API routes
// client/src/utils/integrationClient.ts - Client for interacting with Integration Engine
```

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
  // Additional configuration specific to the integration type
}
```

Key features:
- Path template matching for webhook endpoints
- Automatic node type discovery based on folder structure
- HTTP method routing for different API operations
- Workflow context preservation across requests

### 6. Node Architecture

Nodes are the building blocks of workflows and follow a standardized structure:

```typescript
// Integration Node structure
client/src/nodes/Integration/[node_type]/
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

### 7. Unified Node Registry

The platform has implemented a unified node registry as the single source of truth for node discovery and loading:

```typescript
// client/src/lib/unifiedNodeRegistry.ts
export const initializeUnifiedNodeRegistry = async () => {
  // Discover and register all nodes from the filesystem
  const nodeTypes = await discoverNodeTypes();
  
  // Register UI components and executors
  await registerNodeComponents(nodeTypes);
  await registerNodeExecutors(nodeTypes);
  
  return {
    nodeTypes,
    getNodeComponent,
    getNodeExecutor,
    // Additional utility functions
  };
};
```

The registry provides standardized functions for:
- Discovering nodes via folder structure
- Loading UI components and executors on-demand
- Consistent node type registration
- Utility functions for node management

### 8. Storage System

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

### Creating a Node with Enhanced UI

The platform now uses an improved approach to create nodes with rich, customized UIs:

1. **Start with a template**:
   ```bash
   cp -r client/src/nodes/_node_templates/base_node_template client/src/nodes/Category/your_node_name
   ```

2. **Customize the UI** in `ui.tsx`:
   ```tsx
   export function component({ id, data, selected, isConnectable }: NodeProps) {
     // Create custom content
     const customContent = (
       <div className="p-3 flex flex-col gap-2">
         {/* Your custom UI elements */}
       </div>
     );
     
     // Create custom handles
     const customHandles = (
       <>
         <HandleWithLabel
           type="target"
           position={Position.Left}
           id="input1"
           label="Input"
           isConnectable={isConnectable}
         />
         <HandleWithLabel
           type="source"
           position={Position.Right}
           id="output1"
           label="Output"
           isConnectable={isConnectable}
         />
       </>
     );
     
     // Prepare data for BaseNode
     const baseNodeData = {
       ...data,
       childrenContent: customContent,
       customHandles: customHandles,
       hideDefaultHandles: true
     };
     
     // Always render using BaseNode
     return (
       <BaseNode
         id={id}
         data={baseNodeData}
         selected={selected}
         isConnectable={isConnectable}
         type="your_node_type"
       />
     );
   }
   ```

3. **Component Placement Rules**:
   - Use components in `nodes/components/custom_node_ui` folder for shared functionality
   - Create node-specific components in your node's `components` folder
   - Always use composition with BaseNode, never modify BaseNode itself

### Creating a Custom Test for a Node

Create custom tests for your node by adding a `tests.ts` file to your node's folder:

```typescript
// nodes/Category/my_node_type/tests.ts
import { NodeTest } from '@/nodes/types/nodeTestsStandard';

const tests: NodeTest[] = [
  {
    name: 'Custom Functionality Test',
    description: 'Tests specific behavior of this node',
    category: 'functionality',
    run: async () => {
      try {
        // Test implementation
        return { 
          passed: true, 
          message: 'Test passed successfully' 
        };
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

### Test Running Example

The Node Debug Panel allows running tests for any node:

```typescript
// Example of running tests for a node
async function runNodeTests(nodeType: string) {
  // Load tests from the node's tests.ts file
  const customTests = await loadNodeTests(nodeType);
  
  // Load standard tests that apply to all nodes
  const standardTests = getStandardTests();
  
  // Execute all tests
  const results = await testRunner.runTests(nodeType, [...standardTests, ...customTests]);
  
  // Process results
  const failedTests = results.filter(result => !result.passed);
  if (failedTests.length === 0) {
    console.log(`All tests passed for ${nodeType}!`);
  } else {
    console.error(`${failedTests.length} tests failed for ${nodeType}.`);
  }
}
```

## Best Practices and Guidelines

### 1. Node UI Development

1. **Always Use BaseNode**:
   - Every node UI component should wrap its content in the BaseNode component
   - Don't reinvent functionality that BaseNode provides
   - Use composition pattern for custom functionality

2. **Component Organization**:
   - Place reusable components in `/client/src/nodes/components/custom_node_ui/`
   - Node-specific components go in the node's own components folder
   - Import utilities from appropriate locations

3. **Node Testing**:
   - Create comprehensive tests for all custom nodes
   - Test both standard functionality and edge cases
   - Verify correct behavior with the Node Debug Panel

### 2. Integration Best Practices

1. **Error Handling**:
   - Wrap all Integration Engine interactions in try/catch blocks
   - Provide meaningful error messages
   - Use the createErrorOutput utility for consistent formatting

2. **Configuration Management**:
   - Use sensible defaults for all settings
   - Validate configuration values
   - Handle missing API keys gracefully

3. **Testing**:
   - Create comprehensive tests for all node functionality
   - Test edge cases and error conditions
   - Use the dynamic test discovery system

### 3. Performance Optimization

1. **Component Memoization**:
   - Always wrap UI components with React.memo:
     ```typescript
     export default memo(MyComponent);
     ```
   - Avoid unnecessary re-renders in ReactFlow

2. **Lazy Loading**:
   - Node components load dynamically through the registry
   - Only load components when they're actually used

3. **Bundle Optimization**:
   - Import only what you need
   - Avoid large dependencies in node implementations

### 4. Documentation Standards

1. **Component Documentation**:
   - Include comments for non-obvious code
   - Document complex UI customizations
   - Explain integration API requirements

2. **Type Safety**:
   - Define proper types for all node data
   - Use TypeScript interfaces for consistency
   - Document types in complex structures

## Troubleshooting

### Common Node Issues

1. **Node Not Found in ReactFlow**:
   - Verify node registration in unifiedNodeRegistry
   - Check the node's UI component export (should use default export with memo)

2. **Settings Drawer Not Working**:
   - Ensure node data includes settings schema
   - Verify baseNodeData is properly structured

3. **Integration API Failures**:
   - Check API keys in environment variables
   - Verify API request format matches documentation
   - Look for CORS issues if using browser-based requests

4. **Workflow Execution Errors**:
   - Check logs in both main application and workflow execution servers
   - Verify node connections are properly configured
   - Check for timeouts in long-running workflows

5. **Node Tests Failing**:
   - Review test results in the Node Debug Panel
   - Check that all required exports are present
   - Verify node implementation against test requirements

### Development Workflow

1. **Creating New Nodes**:
   - Start from an appropriate template
   - Follow the node structure convention
   - Test UI before implementing execution logic

2. **Debugging Failed Nodes**:
   - Check console logs for errors
   - Verify imports point to correct locations
   - Test each component individually if needed

3. **API Integration Issues**:
   - Use the built-in HTTP request proxy
   - Check Authorization header formatting
   - Verify content type matches API requirements

## Update History

- 2025-04-30 04:48: Added comprehensive information about the Workflow Execution Engine, Node Testing Framework, and Integration Engine architecture. Updated file structure to reflect new server components. Added sections on Test Running, Creating Custom Tests, and enhanced troubleshooting for the workflow execution system.

- 2025-04-29 20:52: Updated file structure to reflect new node component organization. Node components moved from `client/src/components/nodes` to `client/src/nodes/components`. Updated component paths throughout document. Added information about the Unified Node Registry. Updated node template organization.