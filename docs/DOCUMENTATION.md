# AI Agent Workflow Platform

This project implements a flexible, extensible node-based workflow system for creating, visualizing, and executing workflows. The architecture uses a convention-over-configuration pattern with automatic node discovery based on folder structure, making it easy to add new node types.

> **Note**: For AI assistants helping with this codebase, see [Replit Dev Agent Context](./replit-dev-agent-context-20250424-1051.md) for a comprehensive overview with technical details, code patterns, and troubleshooting guidance.

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Core Architecture](#core-architecture)
3. [Node System](#node-system)
4. [Node Testing Framework](#node-testing-framework)
5. [Workflow Execution Engine](#workflow-execution-engine)
6. [Integration Engine](#integration-engine)
7. [Storage System](#storage-system)
8. [UI Guidelines](#ui-guidelines)
9. [Technical Reference](#technical-reference)
   - [Key Files and Functions](#key-files-and-functions)
   - [Data Structures](#data-structures)
   - [Code Patterns](#code-patterns)
10. [Development Guide](#development-guide)
11. [Troubleshooting](#troubleshooting)

## Quick Start Guide

### Key Features

- **Folder-based Node Architecture**: Each node is a self-contained module with definition, execution logic, and UI
- **Enhanced Node Pattern**: Standardized UI with settings drawer and hover menu functionality
- **Consistent User Experience**: All nodes follow the same visual design patterns
- **Type Safety**: Strong TypeScript typing throughout the system
- **Replit Database Integration**: Persistent storage using Replit's Key-Value Database

### Project Structure

```
client/src/nodes/          # Node implementation folders
  ├── System/              # System nodes (core functionality)
  ├── Custom/              # Domain-specific custom nodes
  ├── Integration/         # External API integration nodes
  ├── Agents/              # Agent-specific nodes
  ├── components/          # Shared node components
  │   ├── base/            # Base node components (Container, Header, Content)
  │   └── custom_node_ui/  # Custom node UI components
  └── _node_templates/     # Templates for creating new nodes

client/src/components/     # Shared UI components (non-node specific)

client/src/lib/            # Core system libraries
  ├── nodeSystem.ts        # Node registration and discovery
  ├── nodeExecution.ts     # Node execution utilities
  └── enhancedWorkflowEngine.ts # Workflow execution
```

### Creating a New Node

To add a new node type:

1. Create a folder in `client/src/nodes/Custom/` with your node name
2. Implement the required files (definition.ts, executor.ts, ui.tsx)
3. Use the DefaultNode pattern for UI implementation
4. Test node functionality in the workflow editor

Example Node UI (using the DefaultNode pattern):

```tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import DefaultNode from '@/nodes/Default/ui';
import { FileText } from 'lucide-react';

// UI component that uses the enhanced DefaultNode
export const component = ({ data, id, selected, isConnectable }) => {
  // Settings schema for the settings drawer
  const nodeSettings = {
    title: "Text Input Settings",
    fields: [
      {
        key: "placeholder",
        label: "Placeholder Text",
        type: "text",
        description: "Text shown when input is empty"
      },
      {
        key: "required",
        label: "Required Field",
        type: "checkbox",
        description: "Whether input is required"
      }
    ]
  };
  
  // Enhance the node data with settings
  const enhancedData = {
    ...data,
    settings: nodeSettings,
    icon: <FileText size={16} />
  };
  
  // Custom node content
  const nodeContent = (
    <>
      {/* Custom UI elements here */}
      
      {/* Standard handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Return enhanced node with our content
  return (
    <DefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </DefaultNode>
  );
};
```

## Core Architecture

The AI Agent Workflow Platform is built around a modular node-based architecture that enables the composition of complex workflows through simple, reusable components. The architecture follows these core design principles:

1. **Modularity**: Each node is a self-contained unit with well-defined interfaces
2. **Discoverability**: Components are automatically discovered and registered
3. **Type Safety**: Strong typing ensures consistent interfaces and validation
4. **Separation of Concerns**: Clear boundaries between definition, execution, and presentation
5. **UI Consistency**: All nodes use the BaseNode structure for consistent styling and behavior

> **Note**: For migrating existing nodes to use the BaseNode structure, see the [BaseNode Migration Guide](./basenode-migration-guide.md).

### Architecture Overview

The platform is built around a modular node-based workflow architecture with a three-server design for optimal separation of concerns:

1. **Main Application Server** (Port 5000)
   - Serves the frontend application
   - Handles user authentication and permissions
   - Manages workflow and node configuration
   - Stores execution logs and results
   - Central coordinator for the system

2. **Workflow Execution Server** (Port 3002)
   - Executes workflows in isolation
   - Prevents workflow errors from affecting the main application
   - Provides job queuing and status tracking
   - Returns execution results to the main server
   - Processes node execution requests

3. **Integration Engine Server** (Port 3001)
   - Manages connections to external services
   - Handles API authentication and proxying
   - Directly receives and processes webhook requests
   - Registers and manages webhook endpoints
   - Provides persistent storage for webhook responses
   - Communicates with the Workflow Execution Server for triggering workflows

The three-server architecture provides several benefits:
- **Separation of Concerns**: Each server has a specific, well-defined responsibility
- **Improved Stability**: Issues in one server don't cascade to others
- **Direct Communication**: Webhooks connect directly to the Integration Engine without proxying
- **Enhanced Security**: Reduced attack surface by isolating critical components
- **Better Performance**: Specialized servers can be optimized for their specific roles

## Node System

### Node Structure

Each node is a self-contained module with three primary components:

1. **Definition (`definition.ts`)**: Declares the node's metadata, input/output ports, and configuration options.
2. **Execution Logic (`executor.ts`)**: Implements the node's functionality when executed within a workflow.
3. **UI Representation (`ui.tsx`)**: Renders the node in the workflow editor canvas.

All nodes are organized in one of three main folders:
- `/client/src/nodes/System/` - For core system nodes
- `/client/src/nodes/Custom/` - For custom, domain-specific nodes
- `/client/src/nodes/Default/` - For default node implementation patterns

### Node Discovery System

The platform implements a convention-over-configuration pattern with automatic node discovery:

```
nodes/
├── System/          # Core system nodes
│   └── {node_type}/
│       ├── definition.ts   # Metadata and interface
│       ├── ui.tsx          # React component
│       └── executor.ts     # Runtime logic
└── Custom/          # User-defined nodes
    └── {node_type}/
        ├── definition.ts
        ├── ui.tsx
        └── executor.ts
```

**Implementation Highlights:**

- **Central Registry (`nodeRegistry.ts`)**: Single source of truth for node types
- **Dynamic Discovery**: Uses Vite's `import.meta.glob` for filesystem scanning
- **Lazy Loading**: Components load on-demand for performance optimization
- **React Memoization**: Prevents unnecessary re-renders in React Flow
- **Fallback Mechanism**: Maintains backward compatibility with legacy nodes

**Key Features:**

1. **Automatic Registration**: New nodes in the correct folders are automatically discovered
2. **Type Safety**: Strong TypeScript interfaces ensure consistent implementation
3. **Performance**: Only loads UI components when they're actually used in a workflow
4. **Event Safety**: Includes proper null-checking for events in NodeHoverMenu components

### Building Custom Nodes

The platform provides a flexible architecture for creating custom nodes by extending the default node system:

1. **Node Structure Pattern**:
   - Each node consists of three core files (definition, executor, UI)
   - The Default node architecture provides a base implementation to extend from
   - Custom nodes can compose the DefaultNode wrapper or selectively use its components
   - The event system enables decoupled integration with platform features

2. **Content Patterns**:
   - `childrenContent` pattern allows placing custom content inside a standardized container
   - `useGlobalSettingsOnly` flag toggles between local and global settings management
   - Icons can be provided as string identifiers or direct React components
   - Notes system integrates with any node regardless of internal implementation

### Default Node Architecture

The Default node implementation serves as both a template and extension point for the node system:

1. **Inheritance Model**: Individual nodes can either:
   - **Compose**: Use DefaultNode as a wrapper component, maintaining full control of inner content
   - **Extend**: Inherit functionality by importing and using shared components

2. **Event Propagation**:
   - DefaultNode dispatches standardized window-level events (e.g., `node-settings-open`)
   - NodeSettingsDrawer listens for these events globally rather than requiring direct props
   - This decouples individual nodes from the settings drawer implementation

3. **Modification Effects**:
   - Changes to Default/ui.tsx affect **new nodes** that use it as a wrapper
   - Existing nodes that don't explicitly use DefaultNode must be updated individually
   - Shared behaviors should be implemented via event systems rather than component inheritance

4. **Node Settings Events**:
   ```typescript
   // Standard pattern for opening settings
   window.dispatchEvent(new CustomEvent('node-settings-open', {
     detail: { nodeId }
   }));
   ```

5. **Icon Management**:
   - Icons can be provided as:
     - Direct React components imported from lucide-react
     - String names for common icons managed by DynamicIcon component
     - Custom React elements 
   - Icons are resolved in DefaultNode's iconElement handler:
   ```typescript
   const iconElement = (
     <div className="bg-primary/10 p-1.5 rounded-md">
       {typeof icon === 'string' ? (
         <DynamicIcon icon={icon} className="h-4 w-4 text-primary" />
       ) : React.isValidElement(icon) ? (
         icon
       ) : (
         <DynamicIcon icon="box" className="h-4 w-4 text-primary" />
       )}
     </div>
   );
   ```

6. **Node Wrapper Design**:
   - NodeContainer provides consistent visual styling and hover behaviors
   - NodeHeader displays title, description, icon, and action buttons
   - NodeContent wraps custom content with consistent padding and styling
   - Customizable action buttons via headerActions array
   - Custom content via childrenContent property 

7. **Node Settings Drawer**:
   - Each node can define a settings schema with field definitions
   - Settings are stored in a standard format in the node's data object
   - The drawer can be opened in two ways:
     - Local settings drawer (within the node component)
     - Global settings drawer (using a global event system)
   - Setting useGlobalSettingsOnly=true enforces use of the global drawer

8. **Hover Menu Pattern**:
   - Customizable hover menu appears after short delay (400ms)
   - Standard actions include duplicate, delete, and settings
   - Hover menu positioned relative to the node with adaptive placement
   - Event-based menu dismissal on various user interactions

9. **Node Note System**:
   - Notes can be added to any node via the noteDialog
   - Notes are stored in the node data (note and showNote properties)
   - Notes displayed consistently at the bottom of the node regardless of node content
   - Event-based note updates via node-note-update event

10. **Global Keyboard Shortcuts**:
    - Delete key to remove selected nodes
    - Ctrl+D or Cmd+D to duplicate selected nodes
    - Esc to cancel current operation or close dialogs

### Node Output Format

All node executors must follow the standardized BaseExecutor pattern to ensure compatibility across the workflow system:

```typescript
// 1. Define node data interface
interface YourNodeData {
  parameter1?: string;
  parameter2?: number;
  // Add node-specific parameters
}

// 2. Implement node-specific logic
async function processNode(
  nodeData: YourNodeData,
  inputs?: Record<string, NodeExecutionData>
): Promise<Record<string, any>> {
  // Your node-specific implementation here...
  
  return {
    output1: result1,
    output2: result2
  };
}

// 3. Export using the standardized wrapper
export const execute = createNodeExecutor<YourNodeData>('your_node_type', processNode);
```

The BaseExecutor pattern automatically handles:
- Consistent output formatting
- Error handling and standardization
- Execution timing and metadata
- Proper WorkflowItem creation

The standardized output format remains the same, but is now managed by the BaseExecutor:

```typescript
interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items with { json, text, _key } format
  meta: {
    startTime: Date;           // When execution started
    endTime: Date;             // When execution completed
    source?: string;           // Source node identifier
    error?: boolean;           // Whether execution resulted in an error
    errorMessage?: string;     // Error message if error is true
    warning?: string;          // Non-critical warning message
    [key: string]: any;        // Additional metadata properties
  };
}
```

> **⚠️ Important:** The older utility functions `createNodeOutput` and `createErrorOutput` have been completely removed from the codebase. All nodes must use the BaseExecutor pattern. See the [BaseExecutor documentation](../client/src/nodes/core/base/README.md) for more details.

## Node Testing Framework

The platform includes a comprehensive testing framework for nodes, featuring both standard and custom test capabilities through a modular, maintainable architecture.

The Node Debug System provides a comprehensive test and debug environment for workflow nodes in the platform. The testing framework is divided into three categories:

### Standard Tests

Standard tests are run on all nodes to ensure they adhere to basic requirements:

1. **File Structure Test**: Verifies that the node has the required `definition.ts` and `executor.ts` files.
2. **Export Validation Test**: Confirms the node properly exports required components.
3. **Metadata Completeness Test**: Validates that the node definition includes all required metadata fields.
4. **Port Definition Test**: Ensures both inputs and outputs are properly defined.
5. **Executor Signature Test**: Verifies the executor function has the correct parameter signature.
6. **Output Format Test**: Confirms the executor returns data in the expected format.
7. **Error Handling Test**: Tests that the node properly formats error responses.

### Integration Tests

Integration tests verify that nodes implementing external service integrations provide the necessary capabilities:

1. **Integration Capabilities Test**: Verifies that integration nodes declare their capabilities (provides/requires).
2. **Integration Requirements Test**: Confirms that integration nodes specify any external requirements.

Integration tests are shown for all nodes regardless of their category to ensure consistent testing across the platform.

### Custom Tests

Nodes can implement custom tests specific to their functionality. These tests are loaded from a `tests.ts` file in the node's folder and allow for testing unique behaviors or requirements.

Custom tests can access the node's definition and executor, and run specific scenarios to validate node behavior.

### Node Debug System

The Node Debug System provides a dedicated interface for testing, validating, and debugging nodes during development:

```
client/src/pages/node-debug/
├── index.tsx                 // Main container component
├── components/               // UI components
│   ├── TestResultsPanel.tsx  // Test results display
│   ├── NodeExecutionPanel.tsx // Node execution interface
│   ├── NodeInputForm.tsx     // Input configuration interface
│   └── ...
└── utils/                    // Utilities
    ├── testRunner.ts         // Test execution logic
    ├── nodeExecutor.ts       // Node execution utilities
    └── ...
```

**Key Features:**

1. **Standard Test Suite**: Runs standard tests for all nodes including:
   - Definition validation
   - Input/output interface verification
   - Execution testing
   - Error handling
   - UI rendering
   - Performance benchmarking
   - Integration testing

2. **Custom Tests Support**: Automatically discovers and runs node-specific custom tests
3. **Visual Dashboard**: Comprehensive UI for test results review
4. **Status Tracking**: Maintains the validation status of each node
5. **Folder-based Testing**: Supports testing entire node folders at once
6. **Interactive Testing**: Allows executing nodes with custom inputs
7. **Real-time Results**: Displays execution results in a structured format
8. **Debugging Tools**: Provides detailed error information and execution traces
9. **Performance Metrics**: Shows execution time and resource usage statistics

### Node Testing Interface

The Node Debug Panel offers several testing modes:

1. **Automated Tests**: Runs predefined test suites (standard, integration, and custom)
2. **Manual Testing**: Allows developers to configure and execute nodes with custom inputs
3. **Batch Testing**: Runs tests on multiple nodes simultaneously for comprehensive validation

When executing manual tests, developers can:
- Select specific input values for each node input port
- Configure node settings for the test run
- View the complete execution results in JSON format
- Examine error details when execution fails
- Compare results with expected outputs

### Test Discovery System

The platform features a dynamic test discovery system:

1. **nodeTestLoader.ts**: A utility that automatically loads test modules for any node type
   ```typescript
   // Key functions
   export const loadNodeTests = async (nodeType: string): Promise<NodeTest[] | null>;
   export const getNodeTypesWithTests = async (): Promise<string[]>;
   export const getTestCountForNodeType = async (nodeType: string): Promise<number>;
   ```

2. **Test Module Structure**: Each node can have its own tests file:
   ```
   client/src/nodes/[Category]/[node_type]/
   ├── definition.ts
   ├── ui.tsx
   ├── executor.ts
   └── tests.ts    // Custom tests for the node
   ```

3. **Standard Test Format**:
   ```typescript
   interface NodeTest {
     name: string;
     description: string;
     category?: string;
     run: () => Promise<NodeTestResult>;
   }
   
   interface NodeTestResult {
     passed: boolean;
     message?: string;
     details?: Record<string, any>;
   }
   ```

### Creating Custom Tests

To implement custom tests for a node:

1. Create a `tests.ts` file in the node's folder
2. Export an array of test objects following the NodeTest interface
3. Implement test-specific logic in each test's `run()` method

**Example Custom Tests** (for send_to_webhook node):

```typescript
const tests: NodeTest[] = [
  {
    name: 'URL Validation',
    description: 'Tests URL format validation for webhook endpoints',
    category: 'validation',
    run: async () => {
      try {
        // Test implementation
        return {
          passed: true,
          message: 'URL validation passed'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error.message}`
        };
      }
    }
  },
  // Additional tests...
];

export default tests;
```

### Test Execution and Results

The test runner (`testRunner.ts`) provides utilities for:

1. **Test Initialization**: Prepares a node for testing with both standard and custom tests
2. **Test Execution**: Runs the tests with proper error handling
3. **Results Calculation**: Determines the overall test status based on results
4. **Results Display**: The TestResultsPanel component visualizes test outcomes

**Test Status Types**:
- `validated` - All tests passed
- `partial` - Some tests passed, some failed or pending
- `failed` - One or more tests failed

### Benefits of the New Architecture

1. **No Hardcoded Relationships**: Tests are dynamically discovered rather than hardcoded
2. **Single Responsibility**: Each component has a clear, focused purpose
3. **Modularity**: Separated test logic from UI components
4. **Maintainability**: Easier to add new test types and functionality
5. **Reusable Components**: TestResultsPanel and testRunner can be used in multiple contexts

## Workflow Execution Engine

The Workflow Execution Engine is a dedicated subsystem responsible for safely executing workflows in isolation from the main application. This architecture is designed to:

1. **Isolate Execution**: Prevent workflow execution errors from affecting the main application
2. **Resource Management**: Segregate computational resources for workflow processing
3. **Fault Tolerance**: Allow workflows to run independently of main application health
4. **Performance**: Enable specialized optimization for workflow execution

The engine operates as a standalone server running on port 3002, separate from the main application server, and uses a queue-based architecture to manage workflow execution requests, track their status, and return results.

### Server Components

#### Simple Queue

The Simple Queue is the core data structure for managing workflow execution jobs:

```typescript
class SimpleQueue {
  private queue: Record<string, WorkflowJob> = {};
  private timeouts: Record<string, NodeJS.Timeout> = {};
  
  enqueue(job: WorkflowJob): string {
    const jobId = job.id || uuidv4();
    const jobWithId = { ...job, id: jobId, status: 'pending' };
    this.queue[jobId] = jobWithId;
    
    // Set timeout for job expiration
    this.timeouts[jobId] = setTimeout(() => {
      if (this.queue[jobId] && this.queue[jobId].status === 'running') {
        this.queue[jobId].status = 'timeout';
        this.queue[jobId].result = { error: 'Workflow execution timed out' };
      }
    }, JOB_TIMEOUT_MS);
    
    return jobId;
  }
  
  getJob(jobId: string): WorkflowJob | undefined {
    return this.queue[jobId];
  }
  
  startJob(jobId: string): boolean {
    if (!this.queue[jobId] || this.queue[jobId].status !== 'pending') {
      return false;
    }
    
    this.queue[jobId].status = 'running';
    this.queue[jobId].startTime = new Date();
    return true;
  }
  
  completeJob(jobId: string, result: any): void {
    if (!this.queue[jobId]) {
      return;
    }
    
    this.queue[jobId].status = 'completed';
    this.queue[jobId].endTime = new Date();
    this.queue[jobId].result = result;
    
    // Clear timeout
    if (this.timeouts[jobId]) {
      clearTimeout(this.timeouts[jobId]);
      delete this.timeouts[jobId];
    }
  }
  
  failJob(jobId: string, error: any): void {
    if (!this.queue[jobId]) {
      return;
    }
    
    this.queue[jobId].status = 'failed';
    this.queue[jobId].endTime = new Date();
    this.queue[jobId].result = { error };
    
    // Clear timeout
    if (this.timeouts[jobId]) {
      clearTimeout(this.timeouts[jobId]);
      delete this.timeouts[jobId];
    }
  }
}
```

#### Workflow Engine

The Workflow Engine handles the core logic of executing workflows:

1. **Node Resolution**: Loads node definitions and executors
2. **Execution Flow**: Manages the flow of data between nodes
3. **Context Management**: Maintains execution context and environment
4. **Results Processing**: Formats and returns execution results

Key components of the Workflow Engine:

```typescript
class WorkflowEngine {
  async executeWorkflow(workflow: Workflow, input?: any): Promise<WorkflowResult> {
    const context: WorkflowContext = {
      workflowId: workflow.id,
      startTime: new Date(),
      nodeResults: {},
      nodeStatus: {},
      input
    };
    
    try {
      // Find the starting node
      const startNode = this.findStartNode(workflow);
      
      // Execute the workflow from the start node
      const result = await this.executeNode(workflow, startNode, context);
      
      return {
        success: true,
        workflowId: workflow.id,
        result,
        context
      };
    } catch (error) {
      return {
        success: false,
        workflowId: workflow.id,
        error: error.message,
        context
      };
    }
  }
  
  async executeNode(workflow: Workflow, node: Node, context: WorkflowContext): Promise<NodeExecutionResult> {
    // Implementation details for node execution
  }
  
  async resolveNodeExecutor(nodeType: string): Promise<NodeExecutor> {
    // Implementation details for node executor resolution
  }
  
  findNextNodes(workflow: Workflow, nodeId: number): Node[] {
    // Find downstream nodes connected to this one
  }
}
```

#### API Endpoints

The Workflow Execution Server exposes two main API endpoints:

1. **Execute Workflow**:
   - `POST /api/workflow-execution/execute`
   - Accepts a workflow definition and optional input data
   - Returns a job ID for tracking execution

2. **Get Execution Status**:
   - `GET /api/workflow-execution/status/:jobId`
   - Returns the current status and results of a workflow execution job

### Integration with Main Application

The main application integrates with the Workflow Execution Engine through a proxy mechanism:

1. **API Proxying**: The main server forwards workflow execution requests to the execution server
2. **Status Polling**: The main server polls execution status and updates workflow logs
3. **Webhook Registration**: The main server registers webhooks with the execution server

Example integration in `server/routes.ts`:

```typescript
// Workflow Execution API - Proxy endpoints
app.post('/api/workflow-execution/execute', async (req: Request, res: Response) => {
  try {
    const response = await fetch('http://localhost:3002/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Workflow execution service unavailable' });
  }
});

app.get('/api/workflow-execution/status/:jobId', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`http://localhost:3002/api/status/${req.params.jobId}`);
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Workflow execution service unavailable' });
  }
});
```

### Error Handling and Resilience

The Workflow Execution Engine implements several error handling mechanisms:

1. **Job Timeouts**: Automatically terminates jobs that exceed maximum execution time
2. **Error Propagation**: Captures and formats node execution errors
3. **Status Tracking**: Maintains detailed status information for each execution
4. **Service Recovery**: Auto-restarts if terminated unexpectedly
5. **Result Persistence**: Ensures results are available even after unexpected termination

### Development and Testing

Testing workflow execution is simplified with dedicated test scripts:

```typescript
/**
 * Test script for Workflow Execution Server
 */
export async function testWorkflowExecution() {
  // Create a simple test workflow
  const workflow = {
    id: 1,
    name: 'Test Workflow',
    type: 'test',
    nodes: [
      {
        id: 1,
        type: 'function_node',
        data: {
          function: 'return { test: "Hello World" };'
        }
      }
    ],
    connections: []
  };
  
  // Submit workflow to execution server
  const response = await fetch('http://localhost:3002/api/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow,
      input: { test: true }
    })
  });
  
  const result = await response.json();
  console.log('Workflow execution job created:', result);
  
  // Poll for results
  const jobId = result.jobId;
  let status = 'pending';
  
  while (status === 'pending' || status === 'running') {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const statusResponse = await fetch(`http://localhost:3002/api/status/${jobId}`);
    const statusResult = await statusResponse.json();
    
    status = statusResult.status;
    console.log('Current status:', status);
    
    if (status === 'completed' || status === 'failed') {
      console.log('Final result:', statusResult);
      break;
    }
  }
}
```

This testing approach allows developers to verify the execution engine's behavior with different workflow configurations.

## Integration Engine

The Integration Engine runs on port 3001 and manages all external service integrations. It operates as a standalone server dedicated to handling external communications, providing:

1. **API Proxying**: Routes API requests through a single endpoint for security and monitoring
2. **Authentication Management**: Handles authentication to external services
3. **Direct Webhook Handling**: Receives and processes webhook requests without proxying through the main server
4. **Endpoint Registration**: Manages webhook endpoints and callbacks
5. **Persistent Storage**: Stores webhook responses for debugging and replay

### Direct Webhook Architecture

The Integration Engine implements a direct webhook handling approach where:

1. **Direct Request Reception**: Webhook requests are received directly by the Integration Engine without proxying through the main application server
2. **Workflow Triggering**: The Integration Engine communicates with the Workflow Execution Server to trigger workflows when webhooks are received
3. **Self-Contained Nodes**: Webhook trigger nodes are self-contained, handling their own URL generation and registration
4. **Performance**: Eliminating proxying reduces latency and improves reliability

#### Webhook Flow

The webhook request flow follows these steps:

1. External system sends a request to a webhook URL (e.g., `/webhooks/workflow/123/node/456`)
2. The Integration Engine receives and validates the request
3. The Integration Engine communicates with the Workflow Execution Engine to trigger the workflow
4. The workflow executes with the webhook payload as input
5. Results are returned to the Integration Engine
6. The Integration Engine responds to the original webhook request

#### Webhook Registration

Webhook registration is handled by the Integration Engine through:

1. **Dynamic Registration**: Webhook nodes register themselves with the Integration Engine during workflow save
2. **Lazy Registration**: Registration occurs when needed, preventing "unknown" workflow ID issues
3. **User Feedback**: UI provides clear guidance when a webhook URL requires a workflow to be saved first

### Integration Capabilities

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

## Storage System

The platform uses the Replit Key-Value Database (via @replit/database) for persistent storage of:

- Workflows
- Nodes
- Agents
- Logs

The storage implementation in `server/storage.ts` provides a comprehensive interface for CRUD operations on all data types, with methods for:
- Getting, creating, updating, and deleting workflows
- Managing agents and their relationships to workflows
- Tracking execution logs

## UI Guidelines

All nodes follow UI design inspired by simple-ai.dev to maintain consistency across the workflow editor:

### Visual Elements

1. **Node Container**:
   - Rounded corners with a consistent padding
   - Should show a subtle shadow and border
   - Selected state should be visually distinct (background change)

2. **Node Header**:
   - Icon representing node function in the primary color
   - Node name in a medium font weight
   - Optional badges for status information

3. **Handle Styling**:
   - Input handles on the left side with consistent positioning
   - Output handles on the right side with consistent positioning
   - Color-coded by data type
   - Consistent height and width

### Layout & Interaction

1. **Content Areas**:
   - Use tabs for different sections (Editor, Preview, Options, etc.)
   - Form controls should have consistent sizing and spacing

2. **Interactive Elements**:
   - Node hover menu appears after a short delay (400ms) and provides actions:
     - Duplicate node
     - Delete node
     - Open settings
     - Edit/customize node
   - Settings drawer opens on demand, does not close when editing form fields
   - Global event listeners handle node interaction events:
     ```typescript
     // Opening settings drawer
     window.addEventListener('node-settings-open', (event) => {
       const { nodeId } = event.detail;
       // Handle opening settings for nodeId
     });
     
     // Other standard events include:
     // - node-duplicate
     // - node-delete
     // - node-edit
     ```

## Technical Reference

### Key Files and Functions

#### 🔑 Top 10 Most Important Files

1. **client/src/lib/nodeRegistry.ts**
   - Central registry for node discovery and registration
   - Uses Vite's `import.meta.glob` for filesystem scanning
   - Single source of truth for node type information
   - Provides paths for dynamic component loading

2. **client/src/nodes/Default/ui.tsx**
   - Base node UI component that provides enhanced functionality
   - Used by all node UI implementations
   - Provides settings drawer and standardized node structure
   - Acts as a composition wrapper rather than a base class

3. **client/src/components/flow/FlowEditor.tsx**
   - Main workflow editor component
   - Implements dynamic node loading with React memoization
   - Handles workflow state management and serialization
   - Creates stable references to prevent unnecessary re-renders

4. **client/src/nodes/components/base/NodeHoverMenu.tsx**
   - Provides a hover menu for node actions with null-safe event handling
   - Uses optional event parameters to prevent runtime errors
   - Creates type-safe action creators with consistent interfaces
   - Implements defensive programming for event handling

5. **client/src/components/flow/NodesPanel.tsx**
   - Displays available nodes organized by category
   - Uses the central registry to populate the node panel
   - Implements filtering and searching capabilities
   - Groups nodes dynamically based on category metadata

6. **client/src/lib/nodeSystem.ts**
   - Legacy node registration system, now using nodeRegistry
   - Maintains backward compatibility with existing nodes
   - Maps node types to implementations

7. **server/storage.ts**
   - Implements storage interface using Replit Key-Value Database
   - Provides CRUD operations for all data types

8. **server/routes.ts**
   - API routes for frontend-backend communication
   - Handles workflow execution requests

9. **shared/schema.ts**
   - Type definitions for data models
   - Used by both frontend and backend

10. **client/src/lib/nodeValidator.ts**
    - Validates node definitions against the required schema
    - Ensures nodes implement the correct interfaces
    - Uses the node registry to verify node compatibility

11. **client/src/lib/nodeTestLoader.ts**
    - Dynamically discovers and loads test modules for nodes
    - Provides methods to find tests for any node type
    - Enables completely decoupled test discovery

12. **client/src/pages/node-debug/utils/testRunner.ts**
    - Centralizes test execution logic
    - Manages test status and result tracking
    - Calculates overall node validation status

13. **client/src/pages/node-debug/components/TestResultsPanel.tsx**
    - Visualizes test results in a structured format
    - Displays both standard and custom test outcomes
    - Shows detailed information like duration and error messages

### Core System Functions

| Function | Purpose | File |
|----------|---------|------|
| `initNodeRegistry()` | Initializes registry and discovers nodes | `nodeRegistry.ts` |
| `getAllNodeTypes()` | Returns array of all discovered node types | `nodeRegistry.ts` |
| `getNodeUIPath()` | Gets path to node UI component | `nodeRegistry.ts` |
| `getNodeExecutorPath()` | Gets path to node executor | `nodeRegistry.ts` |
| `hasNodeType()` | Checks if node type exists in registry | `nodeRegistry.ts` |
| `getNodeInfo()` | Gets metadata for a specific node type | `nodeRegistry.ts` |
| `executeEnhancedWorkflow()` | Runs a workflow with the enhanced node system | `enhancedWorkflowEngine.ts` |
| `validateNodeDefinition()` | Validates a node definition | `nodeValidator.ts` |
| `isNodeTypeImplemented()` | Checks if node is available in the system | `nodeValidator.ts` |
| `loadNodeTests()` | Dynamically loads tests for a specific node type | `nodeTestLoader.ts` |
| `getNodeTypesWithTests()` | Returns all node types that have tests | `nodeTestLoader.ts` |
| `getTestCountForNodeType()` | Counts available tests for a node type | `nodeTestLoader.ts` |
| `initNodeForTesting()` | Prepares a node for test execution | `testRunner.ts` |
| `calculateTestStatus()` | Determines overall test status from results | `testRunner.ts` |
| `runCustomTests()` | Executes custom tests for a node | `testRunner.ts` |

### Storage Functions

| Function | Purpose | File |
|----------|---------|------|
| `MemStorage.initialize()` | Initializes storage and loads data from Replit Database | `storage.ts` |
| `MemStorage.getWorkflows()` | Retrieves all workflows | `storage.ts` |
| `MemStorage.createWorkflow()` | Creates a new workflow | `storage.ts` |
| `MemStorage.saveAllData()` | Persists all data to Replit Database | `storage.ts` |

### API Functions

| Function | Purpose | File |
|----------|---------|------|
| `registerRoutes()` | Sets up all Express routes | `routes.ts` |
| `runWorkflow()` | Executes a workflow through the API | `routes.ts` |
| `handleWebhookRequest()` | Processes incoming webhook requests | `routes.ts` |

### Webhook Integration System

The platform provides a robust webhook system for bidirectional communication with external applications, now with a direct architecture through the Integration Engine:

1. **Direct Webhook Architecture**:
   - Integration Engine directly receives webhook requests at port 3001 
   - No proxying through main application server for reduced latency and better performance
   - Generic path: `/webhooks/:path` - Custom webhook endpoints for flexible integration  
   - Direct workflow triggering: `/webhooks/workflow/:workflowId/node/:nodeId` - For targeted workflow execution
   - Support for multiple HTTP methods (GET, POST, PUT, DELETE) with automatic content negotiation

2. **Self-Contained Webhook Nodes**:
   - Webhook trigger nodes handle their own URL generation and registration
   - Nodes register with the Integration Engine when workflows are saved
   - UI provides clear messaging when URLs require workflow save ("Save workflow to generate URL")
   - No external dependencies for URL generation logic

3. **Webhook Authentication Options**:
   - API Key authentication via X-API-Key header
   - Bearer token authentication via Authorization header
   - Open webhooks for public endpoints and testing
   - Secret key verification for enhanced security

4. **Webhook Request Processing Pipeline**:
   - Headers normalized and passed to workflow
   - Request body parsed based on Content-Type (JSON, form data, etc.)
   - Method and path parameters preserved
   - Structured conversion to node-compatible data format
   - Persistent storage of webhook responses for debugging

5. **Webhook Response Handling Strategies**:
   - Synchronous webhooks return complete workflow results
   - Asynchronous processing with acknowledgment response
   - Standardized status and data response format
   - Configurable timeouts and error handling

6. **Outbound Webhook Features**:
   - Ability to dispatch data to external endpoints
   - Customizable headers and payload formats
   - Retry logic with configurable attempts and backoff
   - Response status and data capture
   
7. **Three-Server Coordination**:
   - Integration Engine (port 3001): Receives webhook requests and registers endpoints
   - Workflow Execution Server (port 3002): Executes workflows triggered by webhooks
   - Main Application Server (port 5000): Manages UI and settings

### Data Structures

#### Core Types

| Type | Description | File |
|------|-------------|------|
| `NodeDefinition` | Defines a node's capabilities | `nodes/types.ts` |
| `NodeExecutorFunction` | Function signature for node execution | `lib/types.ts` |
| `NodeExecutionData` | Standardized output format | `lib/types.ts` |
| `User`, `Agent`, `Workflow`, `Node`, `Log` | Data models | `shared/schema.ts` |
| `IStorage` | Storage interface | `server/storage.ts` |

#### Workflow Data

```typescript
interface Workflow {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  agentId: number | null;
  flowData: {
    nodes: any[];
    edges: any[];
  };
  icon: string | null;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}
```

#### Node Data

```typescript
interface Node {
  id: number;
  workflowId: number;
  type: string;
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}
```

#### Node Definition

```typescript
interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  version: string;
  inputs: Record<string, PortDefinition>;
  outputs: Record<string, PortDefinition>;
  defaultData: Record<string, any>;
}
```

#### NodeSettings Schema

```typescript
interface NodeSettings {
  title: string;
  fields: {
    key: string;         // Field identifier (matches data property)
    label: string;       // Display label
    type: string;        // text, number, select, checkbox, textarea, slider
    description?: string;// Help text
    options?: Array<{    // For select fields
      label: string;
      value: string;
    }>;
    min?: number;        // For number/slider fields
    max?: number;        // For number/slider fields
    step?: number;       // For number/slider fields
  }[];
}
```

#### Node Testing Types

```typescript
// Core testing interfaces
interface NodeTest {
  name: string;          // Test name for display
  description: string;   // Detailed description of what is being tested
  category?: string;     // Optional grouping category
  run: () => Promise<NodeTestResult>; // Test execution function
}

interface NodeTestResult {
  passed: boolean;       // Whether the test passed
  message?: string;      // Optional result message
  details?: Record<string, any>; // Additional test-specific information
  duration?: number;     // Execution time in milliseconds
}

// Test status types
type TestStatus = 'validated' | 'partial' | 'failed' | 'pending';

interface TestSummary {
  status: TestStatus;    // Overall test status
  passed: number;        // Count of passed tests
  failed: number;        // Count of failed tests
  total: number;         // Total test count
  details: NodeTestResult[]; // Full test results
}
```

### Code Patterns

#### 1. Enhanced Node Pattern

```tsx
// In a node UI component
import DefaultNode from '@/nodes/Default/ui';

export const component = ({ data, id, selected }) => {
  // Settings schema
  const nodeSettings = {
    title: "Node Settings",
    fields: [/* fields */]
  };
  
  // Enhanced data
  const enhancedData = {
    ...data,
    settings: nodeSettings
  };
  
  // Node content
  const nodeContent = (
    <>
      {/* Custom content */}
    </>
  );

  return (
    <DefaultNode
      id={id}
      data={enhancedData}
      selected={selected}
    >
      {nodeContent}
    </DefaultNode>
  );
};
```

#### 2. Node Executor Pattern

```typescript
// In executor.ts
export const execute: NodeExecutorFunction = async (nodeData, inputs) => {
  try {
    // Extract input data
    const inputValue = inputs.input || '';
    
    // Process according to node settings
    const result = processData(inputValue, nodeData);
    
    // Return standardized output
    return createNodeOutput({
      result: result
    });
  } catch (error) {
    return createErrorOutput(error.message);
  }
};
```

#### 3. Storage Pattern

```typescript
// Creating an entity
async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
  // Generate ID
  const id = ++this.workflowId;
  
  // Create entity
  const workflow: Workflow = { 
    ...insertWorkflow,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Store in memory
  this.workflows.set(id, workflow);
  
  // Persist to Replit Database
  await this.saveWorkflows();
  
  return workflow;
}
```

## Development Guide

### System Architecture and Data Flow

#### Data Flow Architecture

1. **Frontend-to-Backend Flow**
   - Workflow data is created in the React UI
   - Saved via API to the backend
   - Persisted in Replit Key-Value Database
   - Retrieved on application startup

2. **Node Execution Flow**
   - Workflow execution begins with input nodes
   - Each node processes data and passes to next nodes
   - Results are collected and returned
   - Execution logs are stored

3. **Data Persistence**
   - In-memory storage with periodic Replit DB persistence
   - Data structures are mapped to JSON for storage
   - All entities have standard CRUD operations

### Enhanced Node Pattern

All nodes use a standardized UI pattern:
- Base node component defined in `Default/ui.tsx`
- Settings configured via a schema object
- Settings displayed in a drawer/sheet UI
- Common actions via hover menu

#### Event-Based Communication System

Nodes communicate with the editor and other components through standardized window events:

```typescript
// Node Settings Events
const openSettings = () => {
  window.dispatchEvent(new CustomEvent('node-settings-open', {
    detail: { nodeId: id }
  }));
};

// Event Listener in NodeSettingsDrawer
useEffect(() => {
  const handleSettingsOpen = (event) => {
    const { nodeId } = event.detail;
    setIsOpen(true);
    setCurrentNodeId(nodeId);
  };
  
  window.addEventListener('node-settings-open', handleSettingsOpen);
  return () => window.removeEventListener('node-settings-open', handleSettingsOpen);
}, []);
```

This decoupled event system ensures:
- New nodes automatically work with the settings drawer without direct coupling
- Node UI implementations remain lightweight and focused on presentation
- Global UI components like drawers can be modified independently of nodes

### Node Registration and Discovery

The node system automatically:
- Discovers nodes via folder structure
- Registers node types with the execution engine
- Maps UI components to node types
- Validates node definitions

### Common Tasks

#### 1. Creating a New Node Type

1. Create a folder in `client/src/nodes/Custom/` with your node name
2. Create the three required files:
   - `definition.ts`: Node metadata and interface
   - `executor.ts`: Execution logic
   - `ui.tsx`: Visual component using DefaultNode
3. Ensure it's properly registered in the node system

#### 2. Updating the Node UI

1. Modify components in `client/src/nodes/components/base/`
2. For system-wide changes, modify `client/src/nodes/Default/ui.tsx`
3. For node-specific changes, modify that node's ui.tsx file

> **Important Note on Default Node Updates**: Changes to `Default/ui.tsx` will only affect:
> - New nodes created after the change
> - Existing nodes that explicitly use DefaultNode as a wrapper component
> 
> Individual nodes that implement their own UI without using DefaultNode will need manual updates
> to adopt new features. The recommended approach is to use events for global functionality.

##### Adding Global Node Features

When adding a feature that should work across all nodes:

1. Implement the feature in a reusable component (e.g., in `client/src/nodes/components/base/`)
2. Use standardized window events for communication:
   ```typescript
   // Add this to your new component
   window.dispatchEvent(new CustomEvent('node-feature-event', {
     detail: { nodeId, additionalData }
   }));
   ```
3. Add the component to the DefaultNode implementation
4. For existing non-standard nodes, manually add event dispatching code

#### 3. Working with the Storage System

1. Use the `storage.ts` interface methods for CRUD operations
2. Understand that all data is cached in memory for performance
3. Data is periodically saved to Replit Database

#### 4. Creating Webhook-Enabled Nodes

When building nodes that interact with the webhook system:

1. **Trigger Nodes (Receiving Data)**:
   - Set appropriate category (typically "triggers")
   - Define clear output ports for webhook payload, headers, and method
   - Implement settings for customizing webhook behavior (path, authentication)
   - Use the global settings drawer with useGlobalSettingsOnly=true flag 
   - Display webhook URL to users for easy reference
   - Provide clear validation through the executor

2. **Response Nodes (Sending Data)**:
   - Carefully validate destination URLs (use zod schema validation)  
   - Implement robust error handling with retries
   - Provide detailed status feedback
   - Configure timeout and retry settings
   - Normalize headers and process response data consistently
   - Pass complete response metadata to outputs

3. **Common Webhook Node Patterns**:
   - Store configuration in node data properties
   - Use icon components from lucide-react directly
   - Implement clear content using childrenContent pattern
   - Support note display for documentation
   - Create comprehensive testing strategy for webhook integrations

#### 5. Creating and Running Node Tests

1. **Adding Custom Tests to a Node**:
   - Create a `tests.ts` file in the node's folder
   - Export an array of test objects following the NodeTest interface:
   ```typescript
   const tests: NodeTest[] = [
     {
       name: 'Test Name',
       description: 'What this test verifies',
       category: 'validation',
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

2. **Running Tests**:
   - Navigate to the Node Debug Panel
   - Select a node type from the dropdown
   - Click "Run Tests" to execute both standard and custom tests
   - Review results in the TestResultsPanel

3. **Test Best Practices**:
   - Tests should be isolated and not depend on other tests
   - Use clear, descriptive names and messages
   - Group related tests by category
   - Include detailed error information for failed tests
   - Focus on testing edge cases and error handling

#### 6. Debugging Workflow Execution

1. Check node execution results in the node state
2. Review logs saved to the storage system
3. Trace execution through the enhancedWorkflowEngine

## Troubleshooting

### General Node Issues

| Issue | Possible Solutions |
|-------|-------------------|
| Node not appearing in editor | Place node in correct folder (System/ or Custom/), ensure definition.ts is valid |
| Node not discovered by registry | Check folder structure conforms to conventions, verify definition.ts exports |
| Duplicate nodes in panel | Use only the node registry via `getAllNodeTypes()`, avoid hardcoded lists |
| Dynamic component loading fails | Check if node is registered in nodeRegistry via `hasNodeType()` |
| Unnecessary re-renders | Use `useMemo` for nodeTypes: `useMemo(() => ({ ...baseTypes, ...dynamicTypes }), [dynamicTypes])` |

### Interactive Element Issues

| Issue | Possible Solutions |
|-------|-------------------|
| Hover menu causes errors | Use null-safe event handling: `if (e) e.stopPropagation()` |
| Action click errors | Make event parameters optional: `onClick: (e?: React.MouseEvent) => void` |
| UI not rendering properly | Check component imports and props |
| Inputs not receiving data | Verify input handle IDs match input names |
| Outputs not connecting | Check output handle IDs match output names |
| Execution errors | Add try/catch and verbose logging |
| Type errors | Ensure type definitions match actual data |
| Settings drawer closing unexpectedly | Verify event propagation is properly stopped |
| Hover menu not appearing | Check z-index and positioning calculations |
| Settings for new nodes don't work | Ensure nodes dispatch 'node-settings-open' events properly |
| Node updates not affecting all nodes | Remember DefaultNode changes only affect nodes using it as a wrapper |

### Webhook-Specific Issues

| Issue | Possible Solutions |
|-------|-------------------|
| Webhook URLs not generating | Check server route registration in routes.ts |
| Authentication failures | Verify header format matches expected pattern |
| Webhook not triggering | Test endpoint with curl or Postman directly |
| CORS errors on webhook calls | Add appropriate CORS headers in routes.ts |
| Webhook response timing out | Check timeout settings and async processing flag |
| Webhook response format issues | Ensure proper Content-Type header is set |
| URL validation errors | Check zod schema validation rules |
| Webhook retry not working | Verify retry count and delay settings |
| Webhook payload not parsed | Check Content-Type header on incoming request |
| Missing webhook data | Ensure all required fields are passed between nodes |