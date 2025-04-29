# Node Creation Checklist

This document provides a crystal clear, detailed checklist for creating new nodes and customizing their UI correctly. Follow these steps exactly to ensure proper node creation and component organization.

## Step 1: Initial Setup

- [ ] Choose the appropriate node category:
  - `System/`: Core system functionality nodes
  - `Custom/`: Application-specific nodes
  - `Integration/`: External API integration nodes

- [ ] Copy the appropriate template:
  ```bash
  # For standard processing nodes:
  cp -r client/src/nodes/_node_templates/base_node_template client/src/nodes/[Category]/[your_node_name]
  
  # For data input/output nodes:
  cp -r client/src/nodes/_node_templates/data_node_template client/src/nodes/[Category]/[your_node_name]
  
  # For integration nodes:
  cp -r client/src/nodes/_node_templates/integration_node_template client/src/nodes/[Category]/[your_node_name]
  ```

- [ ] Verify you have these files in your node folder:
  - `definition.ts`
  - `executor.ts`
  - `ui.tsx`
  - `index.ts`

## Step 2: Node Definition

- [ ] Edit `definition.ts` to define your node interface:

  - [ ] Create a typed interface for your node data:
    ```typescript
    export interface YourNodeData {
      label: string;
      description: string;
      // Add node-specific properties
      yourProperty1: string;
      yourProperty2: boolean;
    }
    ```

  - [ ] Define default values:
    ```typescript
    export const defaultData: YourNodeData = {
      label: 'Your Node Name',
      description: 'What your node does',
      yourProperty1: 'default',
      yourProperty2: true
    };
    ```

  - [ ] Configure the node definition:
    ```typescript
    export const definition: NodeDefinition = {
      // Core properties (MUST be unique)
      type: 'your_node_name',  
      name: 'Your Node Name',
      description: 'Detailed description of what your node does',
      category: 'category_name',
      icon: 'icon_name',  // From lucide-react
      version: '1.0.0',
      
      // Default data
      defaultData,
      
      // Input and output ports
      inputs: {
        // Define inputs
      },
      outputs: {
        // Define outputs
      },
      
      // Settings configuration
      settings: {
        title: 'Node Settings',
        fields: [
          // Define settings fields
        ]
      }
    };
    ```

## Step 3: Node Execution Logic

- [ ] Implement processing logic in `executor.ts`:
  ```typescript
  export const execute = async (
    nodeData: Record<string, any>,
    inputs: Record<string, NodeExecutionData> = {}
  ): Promise<Record<string, NodeExecutionData>> => {
    try {
      const startTime = new Date();
      
      // Extract settings from nodeData
      
      // Process inputs
      
      // Generate outputs
      
      const endTime = new Date();
      
      // Return results in standard format
      return {
        output_name: {
          items: [{ json: result }],
          meta: { startTime, endTime }
        }
      };
    } catch (error) {
      // Error handling
      return {
        output_name: {
          items: [{ json: null }],
          meta: { error: true, errorMessage: error.message }
        }
      };
    }
  };
  ```

## Step 4: UI Component Organization

### A. Decide Where to Put UI Components

Follow this decision tree:

1. Is the component used ONLY by this node?
   - YES → Put in your node's folder as a local component
   - NO → Continue to question 2

2. Is the component a specialized version of a component used by multiple nodes?
   - YES → Put in `client/src/components/nodes/custom_node_ui/`
   - NO → Continue to question 3

3. Is the component a fundamental building block for all nodes?
   - YES → Put in `client/src/components/nodes/base/`
   - NO → Put in `client/src/components/nodes/custom_node_ui/`

### B. Creating Node-Specific Components

- [ ] For components ONLY used by your node, create them in your node's folder:
  ```
  your_node_name/
  ├── components/                  # Local components
  │   ├── your_component.tsx       # Node-specific component
  │   └── another_component.tsx    # Another node-specific component
  ├── definition.ts
  ├── executor.ts
  ├── ui.tsx
  └── index.ts
  ```

### C. Creating Shared Components

- [ ] For components used by MULTIPLE nodes, create them in the shared folder:
  ```bash
  # Create component file
  touch client/src/components/nodes/custom_node_ui/your_shared_component.tsx
  
  # Update index.ts to export it
  echo "export * from './your_shared_component';" >> client/src/components/nodes/custom_node_ui/index.ts
  ```

- [ ] Use proper component structure:
  ```typescript
  // client/src/components/nodes/custom_node_ui/your_shared_component.tsx
  import React from 'react';
  
  export interface YourSharedComponentProps {
    // Define props
  }
  
  export function YourSharedComponent({ 
    // Destructure props
  }: YourSharedComponentProps) {
    return (
      // Component JSX
    );
  }
  ```

## Step 5: Implementing Node UI with BaseNode

- [ ] Edit your node's `ui.tsx` file:

1. [ ] Import necessary components:
   ```typescript
   import React from 'react';
   import { NodeProps } from 'reactflow';
   import { BaseNode } from '@/nodes/Base';
   import { Position } from 'reactflow';
   import { defaultData, YourNodeData } from './definition';
   // Import any shared UI components
   import { HandleWithLabel } from '@/components/nodes/custom_node_ui/handle_with_label';
   // Import any local components
   import { YourLocalComponent } from './components/your_local_component';
   ```

2. [ ] Create the component function:
   ```typescript
   import React, { memo } from 'react';
   
   function YourNodeComponent({ id, data, selected, isConnectable }: NodeProps<YourNodeData>) {
     // Merge with defaults for type safety
     const nodeData = { ...defaultData, ...data };
     
     // Extract settings
     const { yourProperty1, yourProperty2 } = nodeData.settingsData || {};
     
     // Create custom UI elements here
   ```

3. [ ] Create custom content:
   ```typescript
   const customContent = (
     <div className="flex flex-col gap-2 p-3">
       {/* Your custom UI here */}
       <YourLocalComponent 
         value={yourProperty1}
         onChange={(newValue) => {
           if (data.onChange) {
             data.onChange({
               ...data,
               settingsData: {
                 ...data.settingsData,
                 yourProperty1: newValue
               }
             });
           }
         }}
       />
     </div>
   );
   ```

4. [ ] Create custom handles:
   ```typescript
   const customHandles = (
     <>
       <HandleWithLabel
         type="target"
         position={Position.Left}
         id="input1"
         label="Input 1"
         isConnectable={isConnectable}
       />
       <HandleWithLabel
         type="source"
         position={Position.Right}
         id="output1"
         label="Output 1"
         isConnectable={isConnectable}
       />
     </>
   );
   ```

5. [ ] Prepare data for BaseNode:
   ```typescript
   const baseNodeData = {
     ...data,
     label: nodeData.label || defaultData.label,
     description: nodeData.description || defaultData.description,
     
     // Content customization
     childrenContent: customContent,
     customHeaderContent: <YourHeaderComponent />, // Optional
     customFooterContent: <YourFooterComponent />, // Optional
     
     // Handle customization
     customHandles: customHandles,
     hideDefaultHandles: true,
     
     // Pass all node data for settings
     settingsData: nodeData
   };
   ```

6. [ ] Render with BaseNode:
   ```typescript
   return (
     <BaseNode
       id={id}
       data={baseNodeData}
       selected={selected}
       isConnectable={isConnectable}
       type="your_node_type"
     />
   );
   ```

7. [ ] Export the component with memo for optimization:
   ```typescript
   export default memo(YourNodeComponent);
   ```

## Step 6: Node Registration

- [ ] Set up exports in `index.ts`:
  ```typescript
  import { definition } from './definition';
  import { execute } from './executor';
  import YourNodeComponent from './ui';
  
  // Export for module usage
  export { definition, execute };
  export const component = YourNodeComponent;
  
  // Default export for dynamic loading
  export default { definition, execute, component: YourNodeComponent };
  ```

## Step 7: Additional Steps for Integration Nodes

If you are creating an Integration Node (for third-party APIs), these additional steps are required:

### A. API Configuration

- [ ] Define API connection details in `definition.ts`:
  ```typescript
  export const definition: NodeDefinition = {
    // Standard node properties...
    
    // Integration-specific properties
    integration: {
      service: 'your_service_name', // e.g., 'openai', 'google', 'slack'
      apiVersion: 'v1',
      defaultEndpoint: 'https://api.service.com/v1',
      authType: 'api_key', // or 'oauth', 'bearer', etc.
      
      // Define available operations
      operations: [
        {
          id: 'list_items',
          name: 'List Items',
          description: 'Get a list of items from the service',
          endpoint: '/items',
          method: 'GET',
          inputSchema: {
            // Zod or JSON schema for inputs
          },
          outputSchema: {
            // Zod or JSON schema for outputs
          }
        },
        // Add more operations...
      ]
    },
    
    // Integration nodes typically have these settings
    settings: {
      title: 'API Settings',
      fields: [
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          description: 'Your service API key'
        },
        {
          key: 'operation',
          label: 'Operation',
          type: 'select',
          options: [
            { label: 'List Items', value: 'list_items' },
            // Add more operations...
          ],
          description: 'Operation to perform'
        },
        // Operation-specific settings...
      ]
    }
  };
  ```

### B. Integration Registry Registration

- [ ] Register your integration with the Integration Engine:
  ```typescript
  // In executor.ts or a separate file
  import { integrationRegistry } from '@/services/integrationEngine';
  
  // Register the integration
  export function registerIntegration() {
    integrationRegistry.register({
      id: 'your_service_name',
      name: 'Your Service Name',
      description: 'Integration with Your Service API',
      icon: 'your-service-icon',
      version: '1.0.0',
      
      // Define authentication handler
      authenticate: async (credentials) => {
        // Verify credentials and return auth info
        return {
          isValid: true,
          credentials: {
            // Processed credentials
          }
        };
      },
      
      // Define request handler
      makeRequest: async (operation, params, credentials) => {
        // Make request to external API
        // Return response
      }
    });
  }
  
  // Call this in your executor or elsewhere
  registerIntegration();
  ```

### C. Credentials Handling

- [ ] Implement secure credential handling:
  ```typescript
  // In executor.ts
  export const execute = async (
    nodeData: Record<string, any>,
    inputs: Record<string, NodeExecutionData> = {}
  ): Promise<Record<string, NodeExecutionData>> => {
    try {
      // Get credentials
      const apiKey = nodeData.apiKey || nodeData.settingsData?.apiKey;
      
      // IMPORTANT: Always validate credentials
      if (!apiKey) {
        throw new Error('API Key is required');
      }
      
      // Use the Integration Engine for requests
      const response = await integrationEngine.request({
        service: 'your_service_name',
        operation: nodeData.operation,
        params: {
          // Operation parameters from settings or inputs
        },
        credentials: {
          apiKey
        }
      });
      
      // Process and return results
      // ...
    } catch (error) {
      // Error handling
    }
  };
  ```

### D. UI Enhancements for Integration Nodes

- [ ] Create integration-specific UI elements:
  ```typescript
  // In ui.tsx
  const customContent = (
    <div className="flex flex-col gap-3 p-3">
      {/* API connection status indicator */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">API Status:</span>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs">{isConnected ? 'Connected' : 'Not Connected'}</span>
        </div>
      </div>
      
      {/* Operation details */}
      <div className="px-3 py-2 bg-muted/30 rounded text-xs">
        <div className="font-medium mb-1">Operation: {getOperationName(operation)}</div>
        <div className="text-muted-foreground">
          {getOperationDescription(operation)}
        </div>
      </div>
      
      {/* Authentication warnings if needed */}
      {!hasValidCredentials && (
        <div className="flex items-center gap-1.5 text-amber-500 text-xs">
          <AlertTriangle className="h-3 w-3" />
          <span>Missing API credentials</span>
        </div>
      )}
    </div>
  );
  ```

### E. Rate Limiting and Error Handling

- [ ] Implement proper rate limiting and error handling:
  ```typescript
  // In executor.ts
  import { rateLimiter } from '@/utils/rateLimiter';
  
  export const execute = async (/*...*/) => {
    try {
      // Check rate limits before making request
      const canProceed = await rateLimiter.check('your_service_name');
      if (!canProceed) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Make the API request
      // ...
      
      // Handle specific API errors
      if (response.status === 429) {
        throw new Error('Service rate limit exceeded');
      }
      
      if (response.status === 401) {
        throw new Error('Invalid API credentials');
      }
      
      // Process successful response
      // ...
    } catch (error) {
      // Enhanced error reporting for integration errors
      return {
        output: {
          items: [{ json: null }],
          meta: {
            error: true,
            errorMessage: error.message,
            errorCode: error.code || 'UNKNOWN_ERROR',
            errorDetails: error.details || null,
            integrationError: true
          }
        }
      };
    }
  };
  ```

## Step 8: Testing Your Node

- [ ] Verify your node appears in the node palette
- [ ] Test adding it to a workflow
- [ ] Validate settings functionality
- [ ] Test input/output connections
- [ ] Verify execution behavior

## Common UI Customization Examples

### Custom Content Examples

#### Basic Information Display
```typescript
const customContent = (
  <div className="p-3 flex flex-col gap-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">Mode:</span>
      <Badge variant="outline" className="bg-primary/10 text-primary">
        {mode}
      </Badge>
    </div>
    
    <div className="text-xs text-muted-foreground mt-1">
      {statusMessage}
    </div>
  </div>
);
```

#### Interactive Controls
```typescript
const customContent = (
  <div className="p-3 flex flex-col gap-3">
    <InputSelect
      label="Operation"
      value={operation}
      options={[
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' }
      ]}
      onChange={(value) => handleChange('operation', value)}
    />
    
    <InputToggle
      label="Enable Feature"
      checked={enableFeature}
      onChange={(checked) => handleChange('enableFeature', checked)}
    />
  </div>
);
```

### Custom Handles Examples

#### Multiple Input/Output Handles
```typescript
const customHandles = (
  <>
    {/* Input handles on left */}
    <HandleWithLabel
      type="target"
      position={Position.Left}
      id="input1"
      label="Data"
      isConnectable={isConnectable}
    />
    <HandleWithLabel
      type="target"
      position={Position.Left}
      id="input2"
      label="Config"
      isConnectable={isConnectable}
      className="top-[60%]"
    />
    
    {/* Output handles on right */}
    <HandleWithLabel
      type="source"
      position={Position.Right}
      id="output1"
      label="Result"
      isConnectable={isConnectable}
    />
    <HandleWithLabel
      type="source"
      position={Position.Right}
      id="output2"
      label="Metadata"
      isConnectable={isConnectable}
      className="top-[60%]"
    />
  </>
);
```

#### Handles with Custom Styling
```typescript
const customHandles = (
  <>
    <Handle
      type="target"
      position={Position.Left}
      id="specialInput"
      style={{ 
        background: 'linear-gradient(to right, #3b82f6, #10b981)',
        border: 'none',
        width: '14px',
        height: '14px'
      }}
      isConnectable={isConnectable}
    />
    <div className="absolute left-2 top-[46px] text-xs text-blue-500 font-medium">
      Special
    </div>
  </>
);
```

## Final UI Component Structure Reference

For complete clarity, here's the folder structure showing where components should be placed:

```
client/
└── src/
    ├── components/
    │   └── nodes/
    │       ├── base/                  # Base node building blocks
    │       │   ├── NodeContainer.tsx  # Used by all nodes
    │       │   ├── NodeHeader.tsx     # Used by all nodes
    │       │   ├── NodeContent.tsx    # Used by all nodes
    │       │   ├── NodeHoverMenu.tsx  # Used by all nodes
    │       │   └── index.ts
    │       │
    │       └── custom_node_ui/        # Shared custom node components
    │           ├── handle_with_label.tsx  # Used by multiple nodes
    │           ├── input_select.tsx       # Used by multiple nodes
    │           └── ...
    │
    └── nodes/
        ├── Base/                      # Core BaseNode implementation
        │   ├── ui.tsx                 # BaseNode component
        │   └── ...
        │
        └── Category/                  # Node category (System, Custom, etc.)
            └── your_node_name/        # Your specific node
                ├── components/        # Local components used ONLY by this node
                │   └── your_local_component.tsx
                ├── definition.ts
                ├── executor.ts
                ├── ui.tsx
                └── index.ts
```

This structure ensures:
1. Common components are properly shared
2. Node-specific components stay encapsulated
3. The codebase remains organized and maintainable
4. BaseNode updates affect all nodes without requiring changes to each node

By following this checklist precisely, you'll create nodes that maintain the proper hierarchy, use components correctly, and benefit from all BaseNode enhancements.