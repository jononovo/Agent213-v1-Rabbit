# Node Executor Base

This directory contains base implementations for node executors in the workflow system.

## NodeExecutorBase.ts

The `NodeExecutorBase.ts` file provides a standardized approach for all node executors to follow, ensuring consistent input handling, error management, and output formatting across the entire workflow system.

### Benefits

- **Consistency**: All nodes produce outputs in the same format
- **Error Handling**: Standardized error responses
- **Simplified Implementation**: Reduces boilerplate in individual nodes
- **Maintainability**: Easier to update and maintain with centralized logic

### How to Use

#### 1. For New Nodes

New nodes should use the `createNodeExecutor` function to wrap their node-specific logic. This ensures all nodes follow the same pattern:

```typescript
import { createNodeExecutor } from '../../core/base/NodeExecutorBase';

// Your node-specific processing logic
async function processNode(nodeData: any, inputs: Record<string, any> = {}) {
  // Node-specific implementation...
  return {
    output1: 'some result',
    output2: { data: 'structured data' }
  };
}

// Export the standardized execute function
export const execute = createNodeExecutor('your_node_type', processNode);
```

#### 2. For Existing Nodes

When updating existing nodes, follow this pattern:

1. Keep your node-specific logic (API calls, data processing, etc.)
2. Replace the direct output creation with the standardized approach
3. Wrap with `createNodeExecutor`

## Examples

See the following nodes for examples of this pattern in action:

- `client/src/nodes/templates/NodeTemplate/executor.ts` - Template for new nodes
- `client/src/nodes/categories/System/claude/executor.ts` - Real-world example

## Why This Approach?

This approach balances several goals:

1. Keeping the function-based pattern that's familiar to the team
2. Ensuring all nodes produce consistent outputs
3. Minimizing changes to existing code
4. Making it easy to create new nodes

The goal is to improve consistency and maintainability without requiring a complete rewrite of all nodes.