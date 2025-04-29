# Ultra-Simple Node Creation Guide

This comprehensive guide explains how to create custom nodes for the workflow system. It covers the entire process from initial setup to advanced customization and integration with external APIs.

## Understanding the Node System Architecture

Before creating nodes, it's important to understand the core architecture:

1. **File Structure**: Each node consists of several key files:
   - `definition.ts`: Defines the node's type, interface, and capabilities
   - `executor.ts`: Contains the logic that processes node inputs and produces outputs
   - `ui.tsx`: Handles the visual representation and interaction in the flow editor
   - `index.ts`: Exports all node components for registration in the system
   - `tests.ts` (optional): Contains automated tests for the node

2. **Node Registry**: All nodes are automatically discovered and registered by the `unifiedNodeRegistry`. This handles validation, executor loading, and UI component discovery.

3. **BaseNode Component**: All node UIs are built on the `BaseNode` component, which provides consistent behavior, styling, and interaction patterns. The BaseNode component offers extensive customization options including custom content, custom header/footer elements, and custom handles.

4. **Component Hierarchy**:
   - `NodeContainer`: Wrapper providing consistent styling
   - `NodeHeader`: Displays the node title, icon, and action buttons
   - `NodeContent`: Contains node-specific controls and information
   - `NodeHoverMenu`: Action menu that appears when hovering over a node

## Creating a Custom Node: Step-by-Step Guide

### 1. Setting Up the Node Structure

The fastest way to create a new node is to copy one of the node templates:

1. **Copy the template directory**:
   ```bash
   # For regular processing nodes
   cp -r client/src/nodes/_node_templates/base_node_template client/src/nodes/Custom/my_new_node
   
   # For data input/output nodes
   cp -r client/src/nodes/_node_templates/data_node_template client/src/nodes/Custom/my_data_node
   ```

2. **Update the file structure** to ensure you have these files:
   ```
   my_new_node/
   ├── definition.ts   # Node definition
   ├── executor.ts     # Processing logic
   ├── ui.tsx          # Visual representation
   └── index.ts        # Exports
   ```

### 2. Defining the Node Interface

Edit the `definition.ts` file to define your node's interface and behavior:

1. **Define the node data structure**:
   ```typescript
   // Define your node's custom data structure
   export interface MyNodeData {
     label: string;
     description: string;
     // Add custom properties your node needs
     operation?: 'add' | 'subtract' | 'multiply';
     useCache?: boolean;
     maxRetries?: number;
   }
   
   // Set default values for your node
   export const defaultData: MyNodeData = {
     label: 'My Custom Node',
     description: 'Performs custom operations on data',
     operation: 'add',
     useCache: false,
     maxRetries: 3
   };
   ```

2. **Configure the node definition**:
   ```typescript
   // Node definition for registration
   export const definition: NodeDefinition = {
     // Core properties - MUST be unique across all nodes!
     type: 'my_custom_node',  
     name: 'My Custom Node',
     description: 'Performs custom operations on input data',
     category: 'processing',  // For grouping in the node palette
     icon: 'calculator',      // Icon name from lucide-react
     version: '1.0.0',        // Semantic versioning
     
     // Default data (from above)
     defaultData,
     
     // Input ports - Define what data the node receives
     inputs: {
       first_value: {
         type: 'number',
         description: 'First value for operation',
       },
       second_value: {
         type: 'number',
         description: 'Second value for operation',
         optional: true,      // This input is optional
       }
     },
     
     // Output ports - Define what data the node produces
     outputs: {
       result: {
         type: 'number',
         description: 'Operation result',
       },
       operation_log: {
         type: 'string',
         description: 'Description of operation performed',
       }
     },
     
     // Settings configuration - For the settings drawer
     settings: {
       title: 'Node Settings',
       fields: [
         {
           key: 'operation',
           label: 'Operation',
           type: 'select',
           options: [
             { label: 'Add', value: 'add' },
             { label: 'Subtract', value: 'subtract' },
             { label: 'Multiply', value: 'multiply' }
           ],
           description: 'Mathematical operation to perform'
         },
         {
           key: 'useCache',
           label: 'Use Cache',
           type: 'checkbox',
           description: 'Cache results for repeated calculations'
         },
         {
           key: 'maxRetries',
           label: 'Maximum Retries',
           type: 'number',
           min: 0,
           max: 10,
           step: 1,
           description: 'Number of retries for failed operations'
         }
       ]
     }
   };
   
   // Export as default
   export default definition;
   ```

### 3. Implementing the Node Logic

Create the processing logic in `executor.ts`:

```typescript
import { NodeExecutionData } from '@/lib/types/workflow';

/**
 * Node executor function
 * 
 * This function is called when the node is executed in a workflow.
 * It processes the input data and returns the output data.
 */
export const execute = async (
  // Node configuration data (from settings)
  nodeData: Record<string, any>,
  // Inputs from connected nodes
  inputs: Record<string, NodeExecutionData> = {},
): Promise<Record<string, NodeExecutionData>> => {
  try {
    // Get start time for performance tracking
    const startTime = new Date();
    
    // Extract settings from node data
    const { operation = 'add', useCache = false, maxRetries = 3 } = nodeData;
    
    // Get input values (with type safety and fallbacks)
    const firstValue = inputs?.first_value?.items?.[0]?.json || 0;
    const secondValue = inputs?.second_value?.items?.[0]?.json || 0;
    
    // Process based on selected operation
    let result;
    let description;
    
    switch (operation) {
      case 'add':
        result = firstValue + secondValue;
        description = `Added ${firstValue} and ${secondValue}`;
        break;
      case 'subtract':
        result = firstValue - secondValue;
        description = `Subtracted ${secondValue} from ${firstValue}`;
        break;
      case 'multiply':
        result = firstValue * secondValue;
        description = `Multiplied ${firstValue} by ${secondValue}`;
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    // Add any custom processing logic here
    if (useCache) {
      // Example of using a caching mechanism
      console.log(`Caching result: ${result}`);
    }
    
    // Get end time
    const endTime = new Date();
    
    // Return multiple outputs (matching the outputs defined in definition.ts)
    return {
      // First output
      result: {
        items: [{ 
          json: result 
        }],
        meta: {
          startTime,
          endTime,
          source: `my_custom_node:${operation}`
        }
      },
      
      // Second output
      operation_log: {
        items: [{ 
          json: description 
        }],
        meta: {
          startTime,
          endTime
        }
      }
    };
  } catch (error) {
    // Proper error handling is crucial
    console.error(`Error in my_custom_node executor:`, error);
    
    // Return error state for all outputs
    return {
      result: {
        items: [{ json: null }],
        meta: {
          error: true,
          errorMessage: error.message
        }
      },
      operation_log: {
        items: [{ json: `Error: ${error.message}` }],
        meta: {
          error: true,
          errorMessage: error.message
        }
      }
    };
  }
};

export default execute;
```

### 4. Creating the Node UI

Implement the visual interface in `ui.tsx`:

```typescript
import React from 'react';
import { NodeProps } from 'reactflow';
import { Calculator, ArrowRight } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { HandleWithLabel } from '@/components/nodes/custom_node_ui/handle_with_label';
import { Position } from 'reactflow';
import { defaultData, MyNodeData } from './definition';

/**
 * UI Component for the custom node
 */
export function component({ id, data, selected, isConnectable }: NodeProps<MyNodeData>) {
  // Merge incoming data with default data to ensure all properties exist
  const nodeData = { ...defaultData, ...data };
  
  // Get settings values with fallbacks
  const { 
    operation = 'add',
    useCache = false,
    maxRetries = 3
   } = nodeData.settingsData || {};
  
  // Create a custom content element for your node
  const customContent = (
    <div className="flex flex-col gap-2 p-3">
      {/* Operation display */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Operation:</span>
        <span className="bg-primary/10 px-2 py-1 rounded text-primary">
          {operation.charAt(0).toUpperCase() + operation.slice(1)}
        </span>
      </div>
      
      {/* Features indicators */}
      <div className="flex gap-2 text-xs text-muted-foreground">
        {useCache && (
          <div className="flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
            <span>Cached</span>
          </div>
        )}
        {maxRetries > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
            <span>Retries: {maxRetries}</span>
          </div>
        )}
      </div>
      
      {/* Add custom UI elements for status, controls, etc. */}
    </div>
  );
  
  // Create the custom handle elements (input/output ports)
  const customHandles = (
    <>
      {/* Input handles - positioned on the left side */}
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="first_value"
        label="First Value"
        isConnectable={isConnectable}
      />
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="second_value"
        label="Second Value"
        isConnectable={isConnectable}
        className="top-[60%]" // Position this handle below the first
      />
      
      {/* Output handles - positioned on the right side */}
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="result"
        label="Result"
        isConnectable={isConnectable}
      />
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="operation_log"
        label="Log"
        isConnectable={isConnectable}
        className="top-[60%]" // Position this handle below the first
      />
    </>
  );
  
  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Calculator className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Prepare the node data with the properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    settingsData: nodeData, // Pass all node data for settings
    childrenContent: customContent, // Custom content to display
    customHandles: customHandles, // Custom handles for connections
    hideDefaultHandles: true // Don't use default handles
  };
  
  // Render the node using BaseNode component
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="my_custom_node"
    />
  );
}

export default component;
```

### 5. Setting Up Node Exports

Create the `index.ts` file to export your node components:

```typescript
// Import all components
import { definition } from './definition';
import { execute } from './executor';
import { component } from './ui';

// Named exports
export { definition, execute, component };

// Default export for dynamic imports
export default { definition, execute, component };
```

## Advanced Node Customization

### Custom UI Components

You can create more advanced UIs using the custom UI components from the `custom_node_ui` folder:

```typescript
import { InputSelect } from '@/components/nodes/custom_node_ui/input_select';
import { InputText } from '@/components/nodes/custom_node_ui/input_text';
import { InputToggle } from '@/components/nodes/custom_node_ui/input_toggle';
import { HandleEditable } from '@/components/nodes/custom_node_ui/handle_editable';
```

Example of creating an advanced node content with interactive controls:

```typescript
const customContent = (
  <div className="flex flex-col gap-3 p-3">
    {/* Interactive operation selector */}
    <InputSelect
      label="Operation"
      value={operation}
      options={[
        { label: 'Add', value: 'add' },
        { label: 'Subtract', value: 'subtract' },
        { label: 'Multiply', value: 'multiply' }
      ]}
      onChange={(newValue) => {
        // Update node data when changed
        if (data.onChange) {
          data.onChange({
            ...data,
            settingsData: {
              ...data.settingsData,
              operation: newValue
            }
          });
        }
      }}
    />
    
    {/* Toggle switch for cache */}
    <InputToggle
      label="Enable Cache"
      checked={useCache}
      onChange={(checked) => {
        if (data.onChange) {
          data.onChange({
            ...data,
            settingsData: {
              ...data.settingsData,
              useCache: checked
            }
          });
        }
      }}
    />
    
    {/* Text input for a custom field */}
    <InputText
      label="Custom Value"
      value={data.settingsData?.customValue || ''}
      onChange={(value) => {
        if (data.onChange) {
          data.onChange({
            ...data,
            settingsData: {
              ...data.settingsData,
              customValue: value
            }
          });
        }
      }}
    />
  </div>
);
```

### Dynamic Handles

For nodes that need to dynamically add or remove handles:

```typescript
// In ui.tsx
import React, { useState, useEffect } from 'react';
import { HandleEditable } from '@/components/nodes/custom_node_ui/handle_editable';

export function component({ id, data, selected, isConnectable }: NodeProps) {
  // Track dynamic handles
  const [dynamicInputs, setDynamicInputs] = useState(data.dynamicInputs || []);
  
  // Update when data changes
  useEffect(() => {
    if (data.dynamicInputs) {
      setDynamicInputs(data.dynamicInputs);
    }
  }, [data.dynamicInputs]);
  
  // Add a new input handle
  const addInputHandle = () => {
    const newInput = `input_${Date.now()}`;
    const newInputs = [...dynamicInputs, newInput];
    
    // Update node data
    if (data.onChange) {
      data.onChange({
        ...data,
        dynamicInputs: newInputs
      });
    }
  };
  
  // Create dynamic handles
  const customHandles = (
    <>
      {/* Static handles */}
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="main_input"
        label="Main Input"
        isConnectable={isConnectable}
      />
      
      {/* Dynamic handles */}
      {dynamicInputs.map((input, index) => (
        <HandleEditable
          key={input}
          type="target"
          position={Position.Left}
          id={input}
          label={`Input ${index + 1}`}
          isConnectable={isConnectable}
          className={`top-[${(index + 2) * 20}%]`}
          onDelete={() => {
            // Remove this handle
            const newInputs = dynamicInputs.filter(i => i !== input);
            if (data.onChange) {
              data.onChange({
                ...data,
                dynamicInputs: newInputs
              });
            }
          }}
        />
      ))}
      
      {/* Output handle */}
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="output"
        label="Output"
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Include a button to add new handles
  const customContent = (
    <div className="flex flex-col gap-2 p-3">
      {/* Other content... */}
      
      <button 
        className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium hover:bg-primary/30"
        onClick={addInputHandle}
      >
        Add Input
      </button>
    </div>
  );
  
  // Continue with BaseNode setup...
}
```

## Creating Integration Nodes

Integration nodes connect your workflows to external APIs and services. They have special capabilities for webhooks, authentication, and proxied API calls.

### 1. Setting Up an Integration Node

```bash
# Create the folder in the Integration directory
mkdir -p client/src/nodes/Integration/my_api_integration
cp -r client/src/nodes/_node_templates/integration_node_template/* client/src/nodes/Integration/my_api_integration/
```

### 2. Configuring Integration Capabilities

Edit the `definition.ts` file with integration-specific configuration:

```typescript
import { NodeDefinition } from '@/types';

export interface MyApiIntegrationData {
  label: string;
  description: string;
  // API-specific settings
  apiKey?: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  useRetries?: boolean;
  maxRetries?: number;
}

export const defaultData: MyApiIntegrationData = {
  label: 'My API Integration',
  description: 'Connects to My API service',
  endpoint: 'https://api.example.com/v1/data',
  method: 'GET',
  useRetries: true,
  maxRetries: 3
};

export const definition: NodeDefinition = {
  type: 'my_api_integration',
  name: 'My API Integration',
  description: 'Connects to My API service',
  category: 'integrations',
  icon: 'globe',
  version: '1.0.0',
  defaultData,
  
  // Input/output ports
  inputs: {
    input: {
      type: 'object',
      description: 'Input data for the API request',
    }
  },
  outputs: {
    output: {
      type: 'object',
      description: 'Response from the API',
    }
  },
  
  // Integration-specific configuration
  integrationConfig: {
    // What this node provides to the system
    provides: {
      endpoint: false,     // This node doesn't expose an HTTP endpoint
      webhook: true,       // This node can receive webhook callbacks
      scheduler: false,    // This node doesn't provide scheduling
    },
    
    // What this node requires from the system
    requires: {
      storage: true,       // Needs persistent storage for API credentials
      authentication: true, // Requires authentication
    },
    
    // Authentication configuration
    authentication: {
      type: 'api_key',
      envVar: 'MY_API_KEY', // Environment variable for the API key
      injectAs: 'header',   // Inject as header, query param, or in body
      headerName: 'X-API-Key', // If injectAs is 'header'
    },
    
    // Webhook configuration (if provides.webhook = true)
    webhook: {
      pathTemplate: '/webhooks/my-api/:id',
      methods: ['POST'],
      authTypes: ['none', 'bearer'],
    }
  },
  
  // Settings for the node settings panel
  settings: {
    title: 'My API Integration Settings',
    fields: [
      {
        key: 'endpoint',
        label: 'API Endpoint',
        type: 'text',
        description: 'The API endpoint URL'
      },
      {
        key: 'method',
        label: 'HTTP Method',
        type: 'select',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' }
        ],
        description: 'HTTP method for the API request'
      },
      {
        key: 'useRetries',
        label: 'Use Retries',
        type: 'checkbox',
        description: 'Enable automatic retry on failure'
      },
      {
        key: 'maxRetries',
        label: 'Max Retries',
        type: 'number',
        min: 1,
        max: 10,
        step: 1,
        description: 'Maximum number of retry attempts'
      }
    ]
  }
};

export default definition;
```

### 3. Implementing the Integration Executor

Create the `executor.ts` file to handle API interactions:

```typescript
import { NodeExecutionData } from '@/lib/types/workflow';

// Helper function for API requests through the Integration Engine
import { makeIntegrationRequest } from '@/lib/integrationAdapter';

/**
 * Integration Node Executor
 */
export const execute = async (
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {},
): Promise<Record<string, NodeExecutionData>> => {
  const startTime = new Date();
  
  try {
    // Extract settings
    const {
      endpoint = 'https://api.example.com/v1/data',
      method = 'GET',
      useRetries = true,
      maxRetries = 3
    } = nodeData.settingsData || nodeData;
    
    // Get input data
    const inputData = inputs?.input?.items?.[0]?.json || {};
    
    // API request configuration
    const requestConfig = {
      url: endpoint,
      method,
      data: method !== 'GET' ? inputData : undefined,
      params: method === 'GET' ? inputData : undefined,
      // Integration Engine automatically handles authentication
      // based on the integrationConfig in definition.ts
      retry: useRetries ? maxRetries : 0
    };
    
    console.log(`Making API request to ${endpoint} with method ${method}`);
    
    // Make the API request through the Integration Engine
    // This automatically handles authentication, proxying, and error handling
    const response = await makeIntegrationRequest(requestConfig);
    
    const endTime = new Date();
    
    // Return successful response
    return {
      output: {
        items: [{ json: response.data }],
        meta: {
          startTime,
          endTime,
          statusCode: response.status,
          headers: response.headers
        }
      }
    };
  } catch (error) {
    console.error('API Integration error:', error);
    
    // Extract error details
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    
    if (error.response) {
      // The request was made and the server responded with an error status
      errorMessage = error.response.data?.message || error.message;
      statusCode = error.response.status;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from API';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message;
    }
    
    // Return error response
    return {
      output: {
        items: [{
          json: {
            error: true,
            message: errorMessage,
            statusCode,
            details: error.response?.data
          }
        }],
        meta: {
          error: true,
          errorMessage,
          statusCode,
          startTime,
          endTime: new Date()
        }
      }
    };
  }
};

export default execute;
```

### 4. Creating the Integration Node UI

Create the `ui.tsx` file with integration-specific UI elements:

```typescript
import React from 'react';
import { NodeProps } from 'reactflow';
import { Globe, ArrowRight, Database, Shield } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';
import { HandleWithLabel } from '@/components/nodes/custom_node_ui/handle_with_label';
import { Position } from 'reactflow';
import { defaultData, MyApiIntegrationData } from './definition';

export function component({ id, data, selected, isConnectable }: NodeProps<MyApiIntegrationData>) {
  // Merge with defaults
  const nodeData = { ...defaultData, ...data };
  const {
    endpoint = defaultData.endpoint,
    method = defaultData.method,
    useRetries = defaultData.useRetries,
    maxRetries = defaultData.maxRetries
  } = nodeData.settingsData || {};
  
  // Get webhook info if available
  const webhookUrl = data.webhookUrl || null;
  
  // Create custom content with integration-specific information
  const customContent = (
    <div className="flex flex-col gap-2 p-3">
      {/* API Endpoint Info */}
      <div className="text-xs flex items-center gap-1 text-muted-foreground">
        <Globe className="h-3 w-3" />
        <span className="font-medium">Endpoint:</span>
        <span className="truncate flex-1">{endpoint}</span>
      </div>
      
      {/* HTTP Method */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Method:</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          method === 'GET' 
            ? 'bg-blue-500/10 text-blue-500' 
            : method === 'POST'
              ? 'bg-green-500/10 text-green-500'
              : method === 'PUT'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-red-500/10 text-red-500'
        }`}>
          {method}
        </span>
      </div>
      
      {/* Retry Configuration */}
      {useRetries && (
        <div className="text-xs flex items-center gap-1 text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span>Auto-retry: {maxRetries}x</span>
        </div>
      )}
      
      {/* Webhook URL (if available) */}
      {webhookUrl && (
        <div className="mt-2 text-xs border border-blue-200 bg-blue-50 p-2 rounded-md">
          <div className="font-medium text-blue-700 mb-1 flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span>Webhook URL:</span>
          </div>
          <code className="text-[10px] block truncate text-blue-800">
            {webhookUrl}
          </code>
        </div>
      )}
      
      {/* Authentication Status */}
      <div className="mt-1 flex items-center gap-1 text-xs">
        <Shield className="h-3 w-3 text-green-500" />
        <span className="text-green-500">API Authentication Ready</span>
      </div>
    </div>
  );
  
  // Create handles for input/output ports
  const customHandles = (
    <>
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="input"
        label="Request Data"
        isConnectable={isConnectable}
      />
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="output"
        label="Response"
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Create icon element with integration-specific styling
  const iconElement = (
    <div className="bg-blue-500/10 p-1.5 rounded-md">
      <Globe className="h-4 w-4 text-blue-500" />
    </div>
  );
  
  // Prepare the node data for BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    settingsData: nodeData,
    childrenContent: customContent,
    customHandles: customHandles,
    hideDefaultHandles: true,
    // Add integration-specific indicators
    isIntegrationNode: true
  };
  
  // Render using BaseNode
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="my_api_integration"
    />
  );
}

export default component;
```

### 5. Webhook Handler (Optional)

If your integration node provides a webhook interface (`provides.webhook: true`), you might need to create a webhook handler:

```typescript
// webhook.ts
export const handleWebhook = async (req, res, params) => {
  console.log('Received webhook callback:', params);
  
  // Extract the node ID from the webhook path
  // This assumes pathTemplate: '/webhooks/my-api/:id' from definition.ts
  const { id } = params;
  
  // Process webhook payload
  const payload = req.body;
  
  // You can trigger a workflow with this payload
  // using the workflowEngine
  const result = await triggerWorkflowFromWebhook(id, payload);
  
  return res.status(200).json({
    success: true,
    message: 'Webhook received successfully',
    nodeId: id,
    result
  });
};

export default handleWebhook;
```

## Adding Automated Tests

Create a `tests.ts` file to add automated tests for your node:

```typescript
import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute } from './executor';

/**
 * Automated tests for the custom node
 */
const tests: NodeTest[] = [
  // Basic functionality test
  {
    name: 'Addition operation',
    description: 'Tests the add operation with two numbers',
    category: 'functionality',
    run: async () => {
      try {
        // Set up test node data
        const nodeData = {
          settingsData: {
            operation: 'add'
          }
        };
        
        // Set up test inputs
        const inputs = {
          first_value: {
            items: [{ json: 5 }],
            meta: { startTime: new Date(), endTime: new Date() }
          },
          second_value: {
            items: [{ json: 3 }],
            meta: { startTime: new Date(), endTime: new Date() }
          }
        };
        
        // Execute the node with test data
        const result = await execute(nodeData, inputs);
        
        // Verify result
        const output = result.result.items[0].json;
        if (output !== 8) {
          return {
            passed: false,
            message: `Expected 8, got ${output}`
          };
        }
        
        return {
          passed: true,
          message: 'Addition test passed'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed with error: ${error.message}`
        };
      }
    }
  },
  
  // Error handling test
  {
    name: 'Error handling',
    description: 'Tests proper error handling with invalid inputs',
    category: 'error_handling',
    run: async () => {
      try {
        // Set up test node data with an invalid operation
        const nodeData = {
          settingsData: {
            operation: 'invalid_operation'
          }
        };
        
        // Set up test inputs
        const inputs = {
          first_value: {
            items: [{ json: 5 }],
            meta: { startTime: new Date(), endTime: new Date() }
          }
        };
        
        // Execute the node with test data
        const result = await execute(nodeData, inputs);
        
        // Verify error is properly handled
        if (!result.result.meta.error) {
          return {
            passed: false,
            message: 'Expected error flag to be true'
          };
        }
        
        return {
          passed: true,
          message: 'Error handling test passed'
        };
      } catch (error) {
        // If the execute function throws instead of returning an error object,
        // that's an actual test failure
        return {
          passed: false,
          message: `Test failed: execute function threw an error: ${error.message}`
        };
      }
    }
  }
];

export default tests;
```

Add tests to your `index.ts` exports:

```typescript
import { definition } from './definition';
import { execute } from './executor';
import { component } from './ui';
import tests from './tests';

export { definition, execute, component, tests };
export default { definition, execute, component, tests };
```

## Best Practices for Node Creation

1. **Type Safety**: Always use TypeScript interfaces to define your node's data structure.

2. **Error Handling**: Implement comprehensive error handling in the executor function.

3. **Default Values**: Always provide sensible defaults for all properties.

4. **UI Consistency**: Use the base UI components for a consistent look and feel.

5. **Testing**: Write automated tests for key functionality.

6. **Documentation**: Add clear JSDoc comments to your code.

7. **Versioning**: Use semantic versioning for node definitions.

8. **Code Organization**: Keep your node files focused and organized.

9. **Performance**: Be mindful of performance, especially for nodes that might process large amounts of data.

10. **Security**: For integration nodes, follow security best practices for handling credentials and external API calls.