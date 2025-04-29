# Replit Dev Agent Context Document

This document provides essential information about the Agent214 platform architecture, focusing on the Integration Engine implementation and enhanced node customization system. This context enables AI assistants to effectively understand, explain, and modify the codebase.

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
│   │   ├── Webhooks/  # Webhook-related nodes
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

/docs/
├── ultra-simple-node-creation.md   # Node creation guide
├── node_creation_checklist.md      # Detailed node creation steps
└── INTEGRATION_ENGINE.md           # Integration Engine documentation
```

## Core Concepts

### 1. BaseNode Customization System

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

### 2. Component Organization

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

### 3. Integration Engine

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

### 4. Node Architecture

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

### 5. Unified Node Registry

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

### 6. Test Discovery System

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

### 7. Storage System

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

1. **Copy integration node template**:
   ```bash
   cp -r client/src/nodes/_node_templates/api_integration client/src/nodes/Integration/your_node_type
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
       // Register with integration engine
       const registrationResult = await registerIntegration({
         nodeType: 'your_node_type',
         capabilities: { /* capabilities */ },
         workflowId,
         nodeId
       });
       
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

4. **Create UI with enhanced customization** in `ui.tsx`:
   ```tsx
   export function component({ id, data, selected, isConnectable }: NodeProps) {
     // API connection status indicator
     const connectionStatusContent = (
       <div className="flex items-center gap-1.5">
         <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
         <span className="text-xs">{isConnected ? 'Connected' : 'Not Connected'}</span>
       </div>
     );
     
     // Custom content for the node body
     const customContent = (
       <div className="p-3 flex flex-col gap-2">
         {/* API operation details */}
         <div className="px-3 py-2 bg-muted/30 rounded text-xs">
           <div className="font-medium mb-1">Operation: {getOperationName()}</div>
           <div className="text-muted-foreground">{getOperationDescription()}</div>
         </div>
       </div>
     );
     
     // Custom header content
     const customHeaderContent = (
       <div className="flex justify-between px-3 pt-1 pb-2 border-b border-border/40">
         <span className="text-xs font-medium">API Status:</span>
         {connectionStatusContent}
       </div>
     );
     
     // Prepare data for BaseNode with enhanced customization
     const baseNodeData = {
       ...data,
       childrenContent: customContent,
       customHeaderContent: customHeaderContent,
       customHandles: <YourCustomHandles />,
       hideDefaultHandles: true
     };
     
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
   
   // Always export as default with React.memo for performance
   export default memo(component);
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

### Creating a Perplexity Integration Node

The Perplexity API node is a specialized integration node:

```typescript
// Definition
export const definition: NodeDefinition = {
  type: 'perplexity_api',
  name: 'Perplexity API',
  description: 'Generates text using the Perplexity AI API',
  category: 'ai',
  defaultData: {
    model: 'llama-3.1-sonar-small-128k-online',
    temperature: 0.7,
    maxTokens: 1000
  },
  inputs: {
    input: { type: 'string', description: 'The prompt text' },
    systemPrompt: { type: 'string', description: 'Optional system prompt', optional: true }
  },
  outputs: {
    output: { type: 'string', description: 'Generated text' },
    fullResponse: { type: 'object', description: 'Full API response' }
  }
};

// Executor
export const execute: NodeExecutorFunction = async (
  nodeData: PerplexityNodeData,
  inputs: Record<string, WorkflowItem[]>
) => {
  try {
    // Process inputs
    const prompt = getInputAsString(inputs.input);
    const systemPrompt = getInputAsString(inputs.systemPrompt);
    
    // Prepare API request
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Missing Perplexity API key');
    }
    
    // Make API request
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: nodeData.model || 'llama-3.1-sonar-small-128k-online',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: nodeData.temperature || 0.7,
        max_tokens: nodeData.maxTokens || 1000
      })
    });
    
    // Process response
    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '';
    
    // Return output
    return createNodeOutput({
      output: generatedText,
      fullResponse: data
    });
  } catch (error) {
    // Handle errors
    return createErrorOutput(error.message);
  }
};

// UI Component
export function component({ id, data, selected, isConnectable }: NodeProps<PerplexityNodeData>) {
  // Settings schema for drawer
  const settingsSchema = {
    model: {
      type: 'select',
      label: 'Model',
      options: [
        { label: 'Llama 3.1 Sonar Small', value: 'llama-3.1-sonar-small-128k-online' },
        { label: 'Llama 3.1 Sonar Large', value: 'llama-3.1-sonar-large-128k-online' },
        { label: 'Llama 3.1 Sonar Huge', value: 'llama-3.1-sonar-huge-128k-online' }
      ],
      description: 'Perplexity AI model to use'
    },
    temperature: {
      type: 'slider',
      label: 'Temperature',
      min: 0,
      max: 1,
      step: 0.1,
      description: 'Controls randomness (higher = more creative, lower = more focused)'
    },
    maxTokens: {
      type: 'number',
      label: 'Max Tokens',
      min: 1,
      max: 5000,
      description: 'Maximum length of generated text'
    }
  };
  
  // Show API key status
  const apiKeyStatus = () => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    return (
      <div className="flex items-center gap-1 text-xs">
        <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{apiKey ? 'API Key Set' : 'Missing API Key'}</span>
      </div>
    );
  };
  
  // Custom node content
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      <div className="text-xs">
        <div className="font-medium mb-1">Model: {data.model || 'Default'}</div>
        <div className="flex justify-between text-muted-foreground">
          <span>Temp: {data.temperature || 0.7}</span>
          <span>Max Tokens: {data.maxTokens || 1000}</span>
        </div>
      </div>
      {apiKeyStatus()}
    </div>
  );
  
  // Handles for connections
  const customHandles = (
    <>
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="input"
        label="Prompt"
        isConnectable={isConnectable}
      />
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="systemPrompt"
        label="System"
        isConnectable={isConnectable}
        style={{ top: 60 }}
      />
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="output"
        label="Text"
        isConnectable={isConnectable}
      />
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="fullResponse"
        label="Full"
        isConnectable={isConnectable}
        style={{ top: 60 }}
      />
    </>
  );
  
  // Prepare enhanced data for BaseNode
  const baseNodeData = {
    ...data,
    childrenContent: customContent,
    customHandles: customHandles,
    hideDefaultHandles: true,
    settings: settingsSchema
  };
  
  // Return BaseNode with our customizations
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="perplexity_api"
    />
  );
}

// Export with memo for performance
export default memo(component);
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

3. **Node READMEs** (`client/src/nodes/CONTEXT.md`):
   - Each node category should have documentation
   - Describe the purpose and functionality of the nodes
   - Include examples and customization options

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

- 2025-04-29 20:52: Updated file structure to reflect new node component organization. Node components moved from `client/src/components/nodes` to `client/src/nodes/components`. Updated component paths throughout document. Added information about the Unified Node Registry. Updated node template organization.

- 2025-04-29 20:30: Initial comprehensive documentation of the Architecture with BaseNode customization and Integration Engine details.