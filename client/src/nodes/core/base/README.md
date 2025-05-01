# BaseExecutor Pattern

## Overview

The BaseExecutor pattern provides a **single, standardized approach** for all node executors in the workflow system. This pattern completely replaces any previous node execution approaches with a unified, consistent method for processing node logic, formatting outputs, and handling errors.

## Key Benefits

- **Unified Pattern**: One consistent approach across all node types
- **Type Safety**: Strong TypeScript typing with generics
- **Error Standardization**: Consistent error handling and formatting
- **Simplified Development**: Reduced boilerplate code
- **Clear Separation**: Business logic separated from output formatting
- **Improved Maintainability**: Common patterns centralized in one location

## BaseExecutor Architecture

The BaseExecutor pattern consists of three main components:

1. **NodeExecutorBase.ts**: The foundation module that contains the BaseExecutor class and factory function
2. **BaseExecutor Class**: Handles common functionality like timing, error formatting, and output standardization
3. **`createNodeExecutor` Function**: A factory function that builds a standardized executor for each node type

## How to Use

### Step 1: Define Your Node Data Interface

In your node's `definition.ts` file:

```typescript
export interface MyNodeData {
  // Node-specific settings and properties
  setting1: string;
  setting2: number;
  // ...
}
```

### Step 2: Create the Process Function

In your node's `executor.ts` file:

```typescript
import { NodeExecutionData } from '@/nodes/core/types/nodeExecutionTypes';
import { createNodeExecutor } from '@/nodes/core/base/NodeExecutorBase';
import { MyNodeData } from './definition';

/**
 * Process the node - focus only on business logic
 */
async function processNode(
  nodeData: MyNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, any>> {
  // 1. Extract settings from nodeData
  const { setting1, setting2 } = nodeData;
  
  // 2. Process input data
  const inputValue = inputs.input?.items[0]?.json;
  
  // 3. Execute your node's core logic
  const result = yourProcessingLogic(inputValue, setting1, setting2);
  
  // 4. Return a simple object with the output values
  // BaseExecutor will handle formatting this into NodeExecutionData
  return {
    output1: result,
    output2: `Processed with setting: ${setting1}`
  };
}
```

### Step 3: Export the Standardized Executor

In the same `executor.ts` file:

```typescript
/**
 * Export the standardized execute function
 * This creates a consistent interface across all nodes
 */
export const execute = createNodeExecutor<MyNodeData>('my_node_type', processNode);
```

## Error Handling

With the BaseExecutor pattern, error handling is simplified:

```typescript
async function processNode(nodeData, inputs) {
  try {
    // Your business logic here
    
    if (!someRequiredValue) {
      // Just throw errors directly - BaseExecutor will format them
      throw new Error('Required value is missing');
    }
    
    return { result };
  } catch (error) {
    // You can handle and rethrow errors for better context
    throw new Error(`Failed to process: ${error.message}`);
  }
}
```

## Output Formatting

The BaseExecutor automatically:

1. Wraps each returned property in a proper `WorkflowItem`
2. Adds timing information
3. Creates standardized metadata
4. Handles error states

Your `processNode` function only needs to return the raw data values, not the fully formatted `NodeExecutionData` structure.

## Testing

Testing nodes with the BaseExecutor pattern is straightforward:

```typescript
// In tests.ts
import { execute } from './executor';
import { defaultData } from './definition';

describe('MyNode', () => {
  it('processes data correctly', async () => {
    const result = await execute(
      { ...defaultData, setting1: 'test' },
      { input: { items: [{ json: 'test input' }] } }
    );
    
    expect(result.items[0].json).toBe('expected result');
  });
});
```

## Migration Guide

If you have existing nodes using the old function-based approach:

1. Define a typed interface for your node data
2. Create a `processNode` function that focuses only on business logic
3. Return a simple object with your outputs instead of formatted `NodeExecutionData`
4. Use `createNodeExecutor` to export your node's execute function
5. Remove any manual error handling or output formatting logic

## Best Practices

- Focus on your node's core business logic in the `processNode` function
- Let the BaseExecutor handle all standard formatting and error handling
- Use strongly typed interfaces for your node data
- Throw errors directly instead of trying to format them
- Return simple objects with your outputs rather than formatted structures

## Example

```typescript
// Old approach (deprecated)
export async function execute(nodeData, inputs) {
  try {
    const result = doSomething();
    return {
      output: {
        items: [{ json: result }],
        meta: { startTime: new Date(), /* etc */ }
      }
    };
  } catch (error) {
    return {
      output: {
        items: [],
        meta: { 
          error: true,
          errorMessage: error.message
        }
      }
    };
  }
}

// New BaseExecutor pattern
async function processNode(nodeData, inputs) {
  // Just focus on the core logic
  const result = doSomething();
  return { output: result };
}

export const execute = createNodeExecutor('my_node', processNode);
```