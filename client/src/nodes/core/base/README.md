# BaseExecutor - The Single, Standardized Execution Pattern

This directory contains the single, standardized approach for all node executors in the workflow system.

## Overview

The `NodeExecutorBase.ts` file provides a complete, unified approach that all nodes must use to ensure consistent output handling, error management, and execution. This is not optional - it's the only way node executors should be implemented to ensure a consistent, maintainable codebase.

### Benefits

- **True Standardization**: Every node follows the exact same pattern
- **Type Safety**: Better TypeScript typing with generics for node data
- **Error Handling**: Centralized, consistent error management
- **Simplified Logic**: Node developers only write business logic
- **Self-Documenting Code**: Clear separation between node-specific and standardized code

## How to Use

### 1. For All Nodes - New and Existing

Every node must use the following pattern:

1. Define a TypeScript interface for the node's data/configuration
2. Create a `processNode` function that implements only the node-specific logic
3. Export the wrapped function using `createNodeExecutor`

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

### 2. Key Requirements

All nodes must:

- Use TypeScript interfaces for node data
- Handle errors by throwing exceptions (BaseExecutor will catch and format them)
- Return simple objects - BaseExecutor handles the conversion to the standard format
- Follow the exact same export pattern

## Examples

See the following nodes for examples of this pattern in action:

- `client/src/nodes/templates/NodeTemplate/executor.ts` - Template for new nodes
- `client/src/nodes/categories/System/claude/executor.ts` - Real-world example

## Under the Hood

The BaseExecutor uses an object-oriented approach internally but exposes a functional API:

1. `createNodeExecutor` creates a custom executor class that extends BaseExecutor
2. Node-specific code is isolated to the `processNode` function
3. Standard output formatting is applied consistently
4. Error handling wraps all node execution

This gives you the benefits of OOP (inheritance, encapsulation) with the simplicity of a functional API for node developers.