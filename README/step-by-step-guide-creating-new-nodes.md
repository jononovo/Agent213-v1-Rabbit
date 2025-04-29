# Step by Step Guide for Creating New Nodes

This technical guide outlines the process of creating new nodes for the workflow system. It provides a comprehensive approach for AI agents and developers to create fully-functional nodes that integrate seamlessly with the workflow editor.

## Table of Contents

1. [Node Architecture Overview](#node-architecture-overview)
2. [File Structure](#file-structure)
3. [Node Components](#node-components)
4. [Step 1: Create Definition File](#step-1-create-definition-file)
5. [Step 2: Create UI Component](#step-2-create-ui-component)
6. [Step 3: Create Executor](#step-3-create-executor)
7. [Node Settings Implementation](#node-settings-implementation)
8. [Validation and Edge Cases](#validation-and-edge-cases)
9. [Testing Your Node](#testing-your-node)
10. [Advanced Node Features](#advanced-node-features)

## Node Architecture Overview

The node system is built around a folder-based architecture where each node type is a self-contained module with:

1. **Definition File**: Declares metadata, ports, settings, and validation rules
2. **UI Component**: Renders the node in the workflow editor
3. **Executor**: Handles the runtime logic when the node executes
4. **Tests File (Optional)**: Contains custom tests for validating node functionality

For quick development, template base nodes are available:
- **Base Standard Node**: Located at `client/src/nodes/Base_nodes/base_node_standard/`
- **Base Integration Node**: Located at `client/src/nodes/Base_nodes/base_node_integration/`

The system uses a central registry (`nodeRegistry.ts`) that discovers and loads node definitions dynamically, making them available throughout the application. This registry is the **single source of truth** for node information, ensuring consistency across the application.

### Node Registry as Single Source of Truth

It's critical to understand that the node registry (`client/src/lib/nodeRegistry.ts`) serves as the authoritative source for all node-related information. This means:

1. **No Hardcoded Node Types**: Never maintain separate lists of node types or hardcode node identifiers
2. **Always Use Registry APIs**: Access node information only through registry methods:
   - `getAllNodeTypes()` - Get complete list of available nodes
   - `getNodeUIPath()` - Get path to node UI component
   - `getNodeExecutorPath()` - Get path to node executor
   - `hasNodeType()` - Check if node type exists
   - `getNodeInfo()` - Get metadata for a specific node type
3. **Auto-Discovery**: The registry automatically finds nodes in the correct folders - no manual registration needed
4. **Dynamic Loading**: Components are loaded on-demand for optimal performance
5. **Programmatic Access**: For AI-driven operations, always query the registry for current state rather than caching node information

## File Structure

Each node should follow this standardized file structure:

```
client/src/nodes/[Category]/[node_type]/
├── definition.ts  // Node definition, metadata, settings
├── ui.tsx         // Visual representation in the editor
├── executor.ts    // Runtime execution logic
└── tests.ts       // (Optional) Custom tests for this node
```

Where:
- `[Category]` can be:
  - `System` - Core system nodes
  - `Custom` - User-created nodes
  - `Integration` - Nodes that connect with external services
  - `Base_nodes` - Template nodes for extending (not used directly)
- `[node_type]` is a unique identifier for your node (e.g., `text_input`, `json_parser`)

The `tests.ts` file is optional but highly recommended, especially for complex nodes. It contains custom tests that validate the specific functionality of your node beyond the standard tests that run for all nodes.

## Node Components

### Definition File
Declares the node's metadata, inputs/outputs, default data, settings, and validation rules.

### UI Component
Renders the node in the workflow editor. Typically extends BaseNode and customizes the appearance.

### Executor
Contains the execution logic that runs when the node is triggered in a workflow.

## Step 1: Create Definition File

The definition file (`definition.ts`) is the most important component, as it:
1. Declares the node's type, name, category, and description
2. Defines input and output ports
3. Sets default data values
4. Specifies settings fields for configuration
5. Provides validation rules using Zod

Here's a comprehensive template:

```typescript
/**
 * [Node Name] Node Definition
 * 
 * [Brief description of what the node does]
 */

import { NodeDefinition } from '../../types';
import { z } from 'zod';

const definition: NodeDefinition = {
  // Core node metadata
  type: 'unique_node_type_id',          // Unique identifier, no spaces
  name: 'Human-Readable Node Name',      // Display name
  description: 'Detailed description of what this node does',
  category: 'category_name',             // One of: actions, logic, data, ai, integration, etc.
  version: '1.0.0',                      // Semantic version
  
  // Input ports definition
  inputs: {
    // Each input has a unique key and definition
    input1: {
      type: 'string',                    // Data type: string, number, boolean, object, any
      description: 'Description of input'
    },
    // Additional inputs...
  },
  
  // Output ports definition
  outputs: {
    // Each output has a unique key and definition
    output1: {
      type: 'object',                    // Data type produced by this port
      description: 'Description of output'
    },
    // Additional outputs...
  },
  
  // Settings array - CRITICAL for NodeSettingsDrawer integration
  settings: [
    {
      key: 'propertyOne',                // Must match a property in defaultData
      type: 'text',                      // Field type: text, number, select, multiselect, textarea, password, json, radio
      label: 'User-friendly label',
      description: 'Help text explaining this setting',
      placeholder: 'Example placeholder',
      required: false                    // Is this setting required?
    },
    {
      key: 'propertyTwo',
      type: 'select',
      label: 'Selection Field',
      description: 'Choose from available options',
      options: [
        { label: 'Option A', value: 'option-a' },
        { label: 'Option B', value: 'option-b' }
      ],
      default: 'option-a'
    },
    {
      key: 'propertyThree',
      type: 'number',
      label: 'Numeric Value',
      description: 'Enter a number',
      min: 0,
      max: 100,
      default: 50
    },
    // Additional settings...
  ]
};

export default definition;
```

### Key Considerations for Definition File

1. **NodeDefinition Interface**: Always implement the correct interface from `../../types.ts` to ensure all required properties are included.

2. **Settings Array**: This is crucial for the `NodeSettingsDrawer` integration. Each setting must include:
   - `key`: Unique identifier for the setting
   - `type`: Determines the input control rendered (text, number, select, etc.)
   - `label` and `description`: User-friendly text
   - Appropriate additional properties based on type (options for select, min/max for number, etc.)

3. **Type Consistency**: Use the approved types for settings:
   - `text`: Text input field
   - `password`: Password input (masked)
   - `number`: Numeric input with optional min/max
   - `select`: Dropdown selection
   - `radio`: Radio button group
   - `textarea`: Multi-line text input
   - `multiselect`: Multiple selection
   - `json`: JSON editor

4. **Inputs and Outputs**: Always define the inputs and outputs with appropriate types and descriptions to generate proper connection points on the node.

5. **Category**: Choose from existing categories to properly group your node:
   - `actions`: Nodes that perform operations or trigger events
   - `logic`: Flow control nodes (if/else, switch, etc.)
   - `data`: Data transformation and processing
   - `ai`: AI/ML model integration
   - `integration`: External service connections
   - `input`: User input nodes
   - `content`: Content generation and formatting

## Step 2: Create UI Component

The UI component (`ui.tsx`) defines how your node appears in the workflow editor. Most nodes should extend the `BaseNode` component for consistency.

Here's a comprehensive template:

```tsx
/**
 * [Node Name] Node UI Component
 * 
 * This component renders the [node type] node in the workflow editor.
 */

import React from 'react';
import { BaseNode } from '@/nodes/Base';
import { Badge } from '@/components/ui/badge';

// Define default data for this node type
export const defaultData = {
  propertyOne: '',
  propertyTwo: 'default-value',
  propertyThree: 0
};

export default function CustomNodeUI({ id, data, isConnectable }: { id: string, data: any, isConnectable?: boolean }) {
  // Extract node settings
  const settings = data?.settings || {};
  const propertyOne = settings.propertyOne || '';
  const propertyTwo = settings.propertyTwo || 'default-value';
  
  // Get execution status for conditional display
  const isProcessing = data?.isProcessing;
  const isComplete = data?.isComplete;
  const hasError = data?.hasError;
  
  // Get the status badge based on execution state
  const getStatusBadge = () => {
    if (isProcessing) return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Processing</Badge>;
    if (isComplete) return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Complete</Badge>;
    if (hasError) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
    return null;
  };
  
  // Custom node content
  const nodeContent = (
    <div className="p-4 flex flex-col gap-2">
      {/* Main property display */}
      <div className="bg-muted/80 p-2 rounded-md flex flex-col">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-muted/50">{propertyTwo}</Badge>
          <div className="text-xs text-muted-foreground">Label</div>
        </div>
        
        <div className="text-xs font-mono mt-1 truncate">
          {propertyOne || 'Not configured'}
        </div>
      </div>
      
      {/* Status badge */}
      {getStatusBadge() && (
        <div className="mt-1">
          {getStatusBadge()}
        </div>
      )}
    </div>
  );
  
  // Render using the BaseNode wrapper
  return (
    <BaseNode 
      id={id} 
      data={{
        ...data,
        hideOutputHandles: false,                // Show output handles
        type: 'unique_node_type_id',             // Must match definition.type
        icon: 'icon-name',                       // Explicitly set the icon
        childrenContent: nodeContent,            // Use childrenContent instead of children
        note: data.note,                         // Pass through note properties
        showNote: data.showNote,
        useGlobalSettingsOnly: true              // Use global settings drawer only
      }}
      isConnectable={isConnectable}
    />
  );
}
```

### Key Considerations for UI Component

1. **Default Data Export**: Export a `defaultData` object that defines default values for all node settings.

2. **Settings Extraction**: Access settings via `data?.settings` to display current configuration.

3. **Status Display**: Use the `isProcessing`, `isComplete`, and `hasError` flags to show execution status.

4. **BaseNode Integration**: Always use the `BaseNode` wrapper for consistency across all nodes.

5. **Type Consistency**: Ensure the `type` property in `BaseNode` matches your node's unique identifier.

6. **isConnectable Prop**: Always pass the `isConnectable` prop to the `BaseNode` component.

## Step 3: Create Executor

The executor (`executor.ts`) contains the logic that runs when the node is executed within a workflow:

```typescript
/**
 * [Node Name] Node Executor
 * 
 * This file handles the execution logic for the [node type] node.
 */

import { NodeExecutionData } from '@shared/nodeTypes';

// Define the node data interface
interface CustomNodeData {
  propertyOne: string;
  propertyTwo: string;
  propertyThree: number;
  // Additional properties...
}

/**
 * Execute function for the custom node
 * This implements the core functionality
 */
export const execute = async (
  nodeData: CustomNodeData,
  inputs?: Record<string, NodeExecutionData>
): Promise<Record<string, NodeExecutionData>> => {
  const startTime = new Date();
  
  try {
    // 1. Extract input data
    const inputData = inputs?.input1?.items?.[0]?.json || {};
    
    // 2. Extract settings from nodeData
    const { propertyOne, propertyTwo, propertyThree } = nodeData;
    
    // 3. Validate required settings
    if (!propertyOne && propertyTwo === 'requires-property-one') {
      throw new Error('Property One is required when Property Two is set to requires-property-one');
    }
    
    // 4. Process the data (implement your node's core logic)
    const result = {
      // Your transformation or processing logic here
      processedValue: `${propertyOne}_${inputData.value || ''}`,
      settings: {
        propertyTwo,
        propertyThree
      }
    };
    
    // 5. Return the result
    return {
      output1: {
        items: [
          {
            json: result
          }
        ],
        meta: {
          startTime,
          endTime: new Date(),
          successCount: 1,
          errorCount: 0
        }
      }
    };
  } catch (error: any) {
    console.error('Error in custom node executor:', error);
    
    // Return standardized error output
    return {
      output1: {
        items: [],
        meta: {
          startTime,
          endTime: new Date(),
          successCount: 0,
          errorCount: 1,
          error: error.message || 'Error processing data'
        }
      }
    };
  }
};
```

### Key Considerations for Executor

1. **Error Handling**: Always wrap execution in a try/catch block and return a properly formatted error output.

2. **Input Extraction**: Handle cases where inputs might be missing or malformed.

3. **Validation**: Validate node settings before processing to provide clear error messages.

4. **Async Support**: The executor should return a Promise for both synchronous and asynchronous operations.

5. **Proper Types**: Define an interface for your node's data to ensure type safety.

6. **Output Format**: Return a record with keys matching the output names defined in the node definition.

## Node Settings Implementation

The settings UI is now handled by the global `NodeSettingsDrawer` component, which:

1. Retrieves settings from the node definition via the registry
2. Transforms them into UI components
3. Handles user input and validation

For your node's settings to appear correctly:

1. Define `settings` in the definition file with all required properties
2. Ensure each setting has a corresponding key
3. Use `key` for property identifiers
4. Use the correct `type` values from the supported list

Example settings array with best practices:

```typescript
settings: [
  {
    key: 'apiEndpoint',
    type: 'text',
    label: 'API Endpoint',
    description: 'Enter the API endpoint URL',
    placeholder: 'https://api.example.com/v1/data',
    required: true
  },
  {
    key: 'method',
    type: 'select',
    label: 'HTTP Method',
    description: 'Select the HTTP method to use',
    options: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'DELETE', value: 'DELETE' }
    ],
    default: 'GET'
  },
  {
    key: 'showAdvanced',
    type: 'select',
    label: 'Show Advanced Options',
    description: 'Enable to configure advanced settings',
    options: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' }
    ],
    default: 'false'
  },
  {
    key: 'timeout',
    type: 'number',
    label: 'Timeout (ms)',
    description: 'Request timeout in milliseconds',
    min: 100,
    max: 30000,
    default: 5000,
    showWhen: (settings) => settings.showAdvanced === 'true' // Conditional display
  }
]
```

## Validation and Edge Cases

When implementing a node, consider these edge cases:

1. **Missing Inputs**: Handle cases where expected inputs are not connected or contain no data.

2. **Malformed Data**: Validate incoming data before processing to prevent runtime errors.

3. **Type Conversions**: Be explicit about data type conversions (string to number, JSON parsing, etc.).

4. **Timeouts**: For external operations, implement proper timeout handling.

5. **Rate Limiting**: For API nodes, handle rate limiting and exponential backoff.

6. **Large Data**: Consider memory implications when processing large datasets.

## Testing Your Node

The system includes a comprehensive testing framework for nodes that's designed for both manual and programmatic testing. This is particularly useful for AI agents that need to verify node functionality.

### Creating Custom Node Tests

To add custom tests for your node, create a `tests.ts` file in your node's directory:

```typescript
import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute, defaultData } from './executor';

// Define your test cases
const tests: NodeTest[] = [
  {
    name: 'Basic functionality',
    description: 'Tests the basic functioning of the node',
    category: 'functionality',
    run: async () => {
      try {
        // Set up test data
        const nodeData = { ...defaultData };
        
        // Create test inputs
        const inputs = {
          input: {
            items: [{ json: { text: 'test input' } }],
            meta: { startTime: new Date() }
          }
        };
        
        // Execute the node
        const result = await execute(nodeData, inputs);
        
        // Validate the result
        if (!result.output?.items?.[0]?.json) {
          return {
            passed: false,
            message: 'No output was produced'
          };
        }
        
        return {
          passed: true,
          message: 'Test passed successfully'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

// Important: export the tests as default
export default tests;
```

### Using the Node Debug Panel

The Node Debug Panel provides a dedicated interface for testing and validating nodes:

1. **For Manual Testing**:
   - Navigate to the Node Debug Panel in the application
   - Select your node from the dropdown list
   - Click "Run Tests" to execute all standard and custom tests
   - View test results in the visual dashboard

2. **For Programmatic Testing** (AI Agents):
   - Use the `nodeTestLoader.ts` utility to find available tests:
     ```typescript
     import { loadNodeTests, getNodeTypesWithTests } from '@/lib/nodeTestLoader';
     
     // Get all node types that have tests
     const nodeTypesWithTests = await getNodeTypesWithTests();
     
     // Load tests for a specific node type
     const tests = await loadNodeTests('your_node_type');
     ```
   - Execute tests using the testRunner utility:
     ```typescript
     import { runStandardTests, runCustomTests, calculateTestStatus } from '@/pages/node-debug/utils/testRunner';
     
     // Run tests and get results
     const standardResults = await runStandardTests('your_node_type');
     const customResults = await runCustomTests('your_node_type');
     
     // Determine overall test status
     const status = calculateTestStatus([...standardResults, ...customResults]);
     ```

### Standard Tests

Every node undergoes these automated tests:

1. **Definition Validation**: Verifies node definition has all required properties
2. **Type Validation**: Checks types for inputs, outputs, and settings
3. **Interface Tests**: Validates that UI components render correctly
4. **Execution Tests**: Runs the node with test inputs to verify functionality
5. **Error Handling**: Tests failure modes and error reporting
6. **Performance**: Benchmarks execution speed and resource usage
7. **Integration**: Verifies compatibility with the workflow system

### Creating Custom Tests

For thorough validation, you can create custom tests specific to your node:

1. Create a `tests.ts` file in your node's directory:

```
client/src/nodes/[Category]/[node_type]/
├── definition.ts
├── ui.tsx
├── executor.ts
└── tests.ts    // Custom tests for your node
```

When creating custom tests for AI-driven node development, follow these guidelines:

1. **Comprehensive Coverage**: Test all key functionalities and edge cases
2. **Isolated Tests**: Each test should be independent and not rely on other tests
3. **Clear Naming**: Use descriptive names that explain exactly what's being tested
4. **Detailed Messages**: Include informative success/failure messages
5. **Categorization**: Group related tests using the `category` property

2. Implement test cases in the `tests.ts` file following this structure:

```typescript
/**
 * Custom tests for [Node Name]
 */
import { NodeTest } from '@/nodes/types/nodeTestsStandard';

const tests: NodeTest[] = [
  {
    name: 'Test Name',
    description: 'Description of what this test validates',
    category: 'functionality', // Optional grouping for similar tests
    run: async () => {
      try {
        // Test implementation
        
        // Return success result
        return {
          passed: true,
          message: 'Test passed successfully'
        };
      } catch (error) {
        // Return failure result
        return {
          passed: false,
          message: `Test failed: ${error.message}`
        };
      }
    }
  },
  // Additional test cases...
];

export default tests;
```

3. Test categories might include:
   - `validation`: Tests for input validation
   - `functionality`: Tests core node features
   - `edge-cases`: Tests boundary conditions
   - `performance`: Tests execution speed and resource usage
   - `integration`: Tests interaction with other components

### Test Discovery System

The application uses a dynamic test discovery system with these technical requirements:

1. **Required File Structure**: Create `tests.ts` in your node directory with exactly this export format:
   ```typescript
   // Must use default export
   export default tests: NodeTest[];
   ```

2. **Test Loading Process**:
   - `nodeTestLoader.ts` dynamically imports test modules at runtime 
   - Test discovery scans all category folders for node types
   - Tests are cached to avoid redundant imports
   - File path pattern: `client/src/nodes/*/[node_type]/tests.ts`

3. **Integration Requirements**:
   - Import your node's executor to use in tests
   - Ensure tests are properly typed with `NodeTest` interface
   - Include timeout handling in long-running tests
   - Return explicit `passed` and `message` properties

4. **Debugging Test Discovery**:
   - Check browser console for test loading logs
   - Verify tests appear under "Custom Tests" tab in node-debug UI
   - Each test should display with name, category label, and description

### Real Example: Perplexity API Tests

Here's a minimal example of a working test file for the Perplexity API node:

```typescript
/**
 * Tests for the Perplexity API Node
 */
import { NodeTest } from '@/nodes/types/nodeTestsStandard';
import { execute } from './executor';

const tests: NodeTest[] = [
  {
    name: 'Basic text generation',
    description: 'Generate a response to a simple prompt',
    category: 'functionality',
    run: async () => {
      try {
        // Setup minimal input data
        const nodeData = {
          system_prompt: '',
          model: 'llama-3.1-sonar-small-128k-online',
          temperature: 0.2,
          max_tokens: 100
        };

        // Create input with a simple query
        const inputs = {
          prompt: {
            items: [{ json: { text: 'What is TypeScript?' } }],
            meta: { startTime: new Date() }
          }
        };

        // Call the node's executor
        const result = await execute(nodeData, inputs);

        // Check if we got a valid response
        if (!result.response?.items?.[0]?.json?.text) {
          return {
            passed: false,
            message: 'No valid text response returned'
          };
        }

        return {
          passed: true,
          message: 'Successfully generated text response'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  }
];

// Must use default export for automatic discovery
export default tests;
```

### Node Debug Panel Architecture

The Node Debug Panel is organized using a modular architecture:

```
client/src/pages/node-debug/
├── index.tsx                 // Main container component
├── components/               // UI components
│   ├── TestResultsPanel.tsx  // Test results display
│   └── ...
└── utils/                    // Utilities
    ├── testRunner.ts         // Test execution logic
    └── ...
```

The system includes:

1. **nodeTestLoader.ts**: A utility that dynamically loads test modules for different node types
   - Provides methods like `loadNodeTests()` to find tests for any node
   - Supports discovering node types with available tests
   - Counts available tests for statistical reporting

2. **testRunner.ts**: Contains utilities for running both standard and custom tests
   - Defines test result interfaces and status types
   - Provides functions for test initialization and execution
   - Calculates overall test status based on results

3. **TestResultsPanel**: A reusable component for displaying test results
   - Shows standard and custom test results
   - Provides visual indicators for test status
   - Displays detailed test information like duration and error messages

### Example: Custom Tests for a Send to Webhook Node

Here's an example of custom tests for a send_to_webhook node:

```typescript
/**
 * Custom tests for Send to Webhook Node
 * 
 * These tests validate the webhook functionality.
 */
import { NodeTest } from '@/nodes/types/nodeTestsStandard';

const tests: NodeTest[] = [
  {
    name: 'URL Validation',
    description: 'Tests URL format validation for the webhook endpoint',
    category: 'validation',
    run: async () => {
      try {
        // Test implementation - validate URL format logic
        const invalidUrls = ['not-a-url', 'http:/missingslash', 'ftp://wrong-protocol.com'];
        const errors = [];
        
        for (const url of invalidUrls) {
          // Call validation function from the node
          try {
            // validateWebhookUrl(url);
            errors.push(`URL ${url} should have failed validation but passed`);
          } catch (e) {
            // This is expected
          }
        }
        
        if (errors.length > 0) {
          return {
            passed: false,
            message: `URL validation failed: ${errors.join(', ')}`
          };
        }
        
        return {
          passed: true,
          message: 'URL validation correctly identifies invalid URLs'
        };
      } catch (error) {
        return {
          passed: false,
          message: `Test failed: ${error.message}`
        };
      }
    }
  },
  {
    name: 'Payload Formatting',
    description: 'Verifies that JSON payloads are properly formatted',
    category: 'functionality',
    run: async () => {
      // Test implementation for payload formatting
      // ...
      return { passed: true, message: 'Payload formatting works correctly' };
    }
  },
  {
    name: 'HTTP Headers Configuration',
    description: 'Tests custom header configuration',
    category: 'functionality',
    run: async () => {
      // Test implementation for headers
      // ...
      return { passed: true, message: 'Header configuration works as expected' };
    }
  },
  {
    name: 'Error Response Handling',
    description: 'Verifies proper handling of error responses',
    category: 'edge-cases',
    run: async () => {
      // Test implementation for error handling
      // ...
      return { passed: true, message: 'Error responses are handled properly' };
    }
  }
];

export default tests;
```

These tests demonstrate how to validate different aspects of a node's functionality, from input validation to error handling.

## Creating Integration Nodes

Integration nodes are specialized nodes that can autonomously connect with external services through the Integration Engine. These nodes use a folder-based discovery approach with declarative configuration to automatically register with the Integration Engine.

### Integration Node Structure

Integration nodes follow a specific folder structure for automatic discovery:

```
client/src/nodes/
└── Integration/                 # Special folder for integration nodes
    └── CategoryName/            # Integration category (e.g., Webhooks, API)
        └── node_type_name/      # Node type folder
            ├── definition.ts    # Node definition with integration config
            ├── executor.ts      # Execution logic
            └── ui.tsx           # Configuration UI
```

Key points:
- All integration nodes must be placed under the `Integration/` directory
- Nodes are grouped by category (e.g., Webhooks, API, etc.)
- Each integration node follows the standard three-file structure

### Integration Definition File

The definition file for integration nodes includes additional `integrationConfig` section:

```typescript
const definition: NodeDefinition = {
  type: 'webhook_trigger_integration',
  name: 'Webhook Trigger (Integration)',
  description: 'Creates a webhook endpoint for triggering workflows',
  category: 'triggers',
  icon: 'webhook',
  version: '1.0.0',
  
  inputs: {
    // Input definitions
  },
  
  outputs: {
    // Output definitions  
  },
  
  defaultData: {
    // Default configuration
  },
  
  // Integration-specific configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // This node provides an HTTP endpoint
      webhook: true,      // This node acts as a webhook receiver
      scheduler: false    // This node doesn't schedule anything
    },
    
    // What the node needs from the system
    requires: {
      storage: true,       // Needs persistent storage for configuration
      authentication: false // Doesn't require authentication by default
    },
    
    // Endpoint configuration
    endpoint: {
      pathTemplate: 'webhooks/:path',  // URL path template
      methods: ['POST', 'GET'],        // Supported HTTP methods
      authTypes: ['none', 'apiKey'],   // Supported auth methods
    }
  }
};
```

### Integration Executor

The executor for integration nodes needs to register with the Integration Engine:

```typescript
import { registerIntegration, getIntegrationUrl } from '@utils/integrationClient';
import { NodeExecutionData } from '@lib/types/workflow';

// Node data structure
interface WebhookTriggerNodeData {
  webhookPath: string;
  description: string;
  methods: string[];
  authType: string;
}

/**
 * Execute the integration node
 */
export const execute = async (
  nodeData: WebhookTriggerNodeData,
  inputs?: any,
  context?: any
): Promise<NodeExecutionData> => {
  try {
    // If we're in a workflow run with inputs, process them
    if (inputs?.webhook) {
      // Process webhook data and return results
      return {
        items: [{ json: inputs.webhook }],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      };
    }
    
    // Extract context
    const workflowId = context?.workflowId;
    const nodeId = context?.nodeId;
    
    if (!workflowId || !nodeId) {
      throw new Error('Integration node requires workflow context');
    }
    
    // Register with integration engine
    const registrationResult = await registerIntegration({
      nodeType: 'webhook_trigger_integration',
      capabilities: {
        provides: {
          endpoint: true,
          webhook: true
        },
        endpoint: {
          pathTemplate: 'webhooks/:path',
          methods: nodeData.methods || ['POST']
        }
      },
      workflowId,
      nodeId,
      description: nodeData.description || 'Webhook endpoint'
    });
    
    // Generate the full webhook URL
    const webhookUrl = getIntegrationUrl(registrationResult.path);
    
    // Return information about the registered webhook
    return {
      items: [{
        json: {
          webhookUrl,
          path: registrationResult.path,
          methods: registrationResult.methods,
          description: registrationResult.description
        }
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date()
      }
    };
  } catch (error) {
    console.error('Error in integration node executor:', error);
    
    // Return standardized error output
    return {
      items: [{
        json: {
          error: error instanceof Error ? error.message : String(error)
        }
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        error: true,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };
  }
};
```

### Integration UI Component

The UI component for integration nodes provides configuration interface and previews:

```tsx
import React, { useCallback } from 'react';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { getIntegrationBaseUrl } from '@utils/integrationClient';

export default function WebhookTriggerNodeSettings({ 
  data, 
  updateNodeData 
}: { 
  data: any; 
  updateNodeData: (data: any) => void;
}) {
  // Get base URL for displaying preview
  const baseUrl = getIntegrationBaseUrl();
  
  // Update node data
  const handleChange = useCallback((field: string, value: any) => {
    updateNodeData({
      ...data,
      [field]: value
    });
  }, [data, updateNodeData]);
  
  // Handle webhook path change
  const handlePathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange('webhookPath', e.target.value);
  }, [handleChange]);
  
  // Current values with defaults
  const webhookPath = data.webhookPath || '';
  
  // Calculate the full webhook URL preview
  const webhookUrlPreview = `${baseUrl}/webhooks/${webhookPath || ':path'}`;
  
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="webhookPath">Webhook Path</Label>
        <Input
          id="webhookPath"
          value={webhookPath}
          onChange={handlePathChange}
          placeholder="my-webhook"
        />
      </div>
      
      {/* Additional settings */}
      
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
        <Label>Webhook URL Preview</Label>
        <p className="text-sm font-mono mt-1 break-all">
          {webhookUrlPreview}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          This URL will be generated when the workflow is saved and run
        </p>
      </div>
    </div>
  );
}
```

### Integration Node Types

Common integration node types include:

1. **Webhook Nodes**
   - Webhook Trigger: Creates an endpoint that starts a workflow when called
   - Webhook Response: Sends a response back to the caller

2. **API Integration Nodes**
   - API Request: Makes HTTP requests to external APIs
   - API Endpoint: Creates an API endpoint for external systems to call

3. **Service-Specific Nodes**
   - Slack Integration: Sends messages to Slack
   - Email Integration: Sends emails
   - Database Integration: Connects to external databases

### Testing Integration Nodes

To test integration nodes:

1. Use the built-in Integration Engine test endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/test-integration-engine
   ```

2. Test specific endpoints directly:
   ```bash
   curl -X GET http://localhost:5000/api/integration/your-endpoint-path
   ```

See the [Integration Engine Documentation](INTEGRATION_ENGINE.md) and [Integration Nodes Guide](INTEGRATION_NODES.md) for more details.

## Advanced Node Features

### Conditional Settings

You can make settings appear conditionally based on other settings:

```typescript
{
  key: 'advancedSetting',
  type: 'text',
  label: 'Advanced Setting',
  description: 'Only shown when advanced mode is enabled',
  showWhen: (settings) => settings.mode === 'advanced'
}
```

### Multi-Output Nodes

For nodes with multiple outputs:

1. Define each output in the `outputs` object
2. In the executor, return an object with keys matching the output names:

```typescript
return {
  success: {
    items: [{ json: successResult }],
    meta: { /* meta data */ }
  },
  error: {
    items: [{ json: errorResult }],
    meta: { /* meta data */ }
  }
};
```

### Node with Dynamic Ports

For nodes with dynamic input/output ports:

1. Implement a port configuration mechanism in settings
2. Update the UI component to render the dynamic ports
3. In the executor, process each input dynamically

## Integration Nodes

Integration nodes are a special type of node that connect with external systems through webhooks, APIs, and other integration points. These nodes leverage the Integration Engine to register endpoints and handle external requests.

### Integration Node Structure

Integration nodes follow a special folder structure:

```
client/src/nodes/
└── Integration/               ← All integration nodes must be in this folder
    └── CategoryName/          ← Integration category (e.g., Webhooks, APIs)
        └── node_type_name/    ← Specific node type
            ├── definition.ts  ← Node definition with integration config
            ├── executor.ts    ← Execution logic
            └── ui.tsx         ← Configuration UI
```

### Integration Node Definition

Integration nodes require additional configuration in their definition file:

```typescript
const definition: NodeDefinition = {
  type: 'webhook_trigger_integration',
  name: 'Webhook Trigger',
  description: 'Creates an endpoint that triggers a workflow when called',
  category: 'triggers',
  // Standard node properties (inputs, outputs, etc.)
  
  // Integration-specific configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // This node provides an HTTP endpoint
      webhook: true,      // This node acts as a webhook receiver
      scheduler: false    // This node doesn't schedule anything
    },
    
    // What the node needs from the system
    requires: {
      storage: true,       // Needs persistent storage
      authentication: true // Requires authentication
    },
    
    // Endpoint configuration (when provides.endpoint = true)
    endpoint: {
      pathTemplate: 'webhooks/:path',  // URL path template with parameters
      methods: ['POST', 'GET'],        // Supported HTTP methods
      authTypes: ['apiKey', 'bearer'], // Supported auth methods
    }
  }
};
```

### Integration Node Executor

Integration node executors must register with the Integration Engine:

```typescript
import { registerIntegration, getIntegrationUrl } from '@utils/integrationClient';

export const execute = async (
  nodeData: WebhookTriggerNodeData,
  inputs?: any,
  context?: any
): Promise<NodeExecutionData> => {
  try {
    // If being triggered by a webhook during workflow execution
    if (inputs?.webhook) {
      return {
        items: [{ json: inputs.webhook }],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      };
    }
    
    // When first run in the workflow editor, register with Integration Engine
    const workflowId = context?.workflowId;
    const nodeId = context?.nodeId;
    
    if (!workflowId || !nodeId) {
      throw new Error('Webhook trigger node requires workflow context');
    }
    
    // Register with integration engine
    const registrationResult = await registerIntegration({
      nodeType: 'webhook_trigger_integration',
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
      description: 'Webhook endpoint'
    });
    
    // Return information about the registered webhook
    return {
      items: [{
        json: {
          webhookUrl: getIntegrationUrl(registrationResult.path),
          path: registrationResult.path,
          methods: registrationResult.methods,
          description: registrationResult.description
        }
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date()
      }
    };
  } catch (error) {
    // Handle errors...
  }
};
```

### Integration Node UI

The UI component for integration nodes often includes special displays:

```tsx
export default function WebhookTriggerNodeSettings({ data, updateNodeData }) {
  // Get base URL for displaying preview
  const baseUrl = getIntegrationBaseUrl();
  
  // Calculate the full webhook URL preview
  const webhookUrlPreview = `${baseUrl}/webhooks/${data.webhookPath || ':path'}`;
  
  return (
    <div className="space-y-4 p-2">
      {/* Configuration UI */}
      
      {/* URL Preview */}
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
        <Label>Webhook URL Preview</Label>
        <p className="text-sm font-mono mt-1 break-all">
          {webhookUrlPreview}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          This URL will be generated when the workflow is saved and run
        </p>
      </div>
    </div>
  );
}

---

## Guidance for AI Agents

For AI agents that are programmatically creating, testing, and publishing nodes, follow these additional principles:

### 1. Node Development Process

1. **Planning Phase**:
   - Clearly identify the node's purpose and intended functionality
   - Map required inputs, outputs, and settings
   - Research any external APIs or services needed
   - Define expected error states and handling strategies

2. **Implementation Phase**:
   - Create all required files following the structure in this guide
   - Adhere strictly to type definitions and interfaces
   - Implement proper error handling with informative messages
   - Add comprehensive comments to explain complex logic

3. **Testing Phase**:
   - Create custom tests covering all core functionality
   - Ensure tests verify both success and failure paths
   - Test with different input permutations
   - Verify edge cases and error conditions

4. **Publishing Phase**:
   - Verify final node against the node registry to confirm discovery
   - Update documentation with node usage examples
   - Ensure the node appears correctly in the node panel
   - Confirm integration with the workflow system

### 2. Critical Considerations

1. **Registry-First Approach**: Always use the node registry as the single source of truth rather than maintaining separate lists of nodes or hardcoding references.

2. **Always Use Standard Patterns**: Follow the established patterns for:
   - Node folder structure
   - File naming conventions
   - Component exports
   - Type definitions
   - Test implementation

3. **Avoid Side Effects**: Nodes should be self-contained and not create unexpected side effects in the system:
   - Don't modify global state outside the node's scope
   - Clean up any resources your node allocates
   - Handle errors gracefully without crashing the application

4. **Performance Awareness**: Consider performance implications:
   - Include performance tests in your custom tests
   - Handle large datasets appropriately
   - Implement proper timeout handling for external services
   - Use asynchronous code patterns correctly

5. **Documentation Quality**: Generate clear, concise documentation:
   - Provide examples of node usage
   - Document all settings and their effects
   - Include sample inputs and expected outputs
   - Note any limitations or constraints

By following this guide, you can create robust, maintainable nodes that integrate seamlessly with the workflow system. Remember that the key to a successful node implementation is thorough testing and comprehensive error handling.