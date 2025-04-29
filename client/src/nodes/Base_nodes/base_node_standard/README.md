# Base Standard Node Template

This template provides a starting point for creating standard nodes in the workflow system. Use this template to create nodes that process data within the workflow without requiring external integration.

## Quick Start

1. Copy this entire folder to create your node:
   ```
   cp -r client/src/nodes/Base_nodes/base_node_standard client/src/nodes/[Category]/[your_node_type]
   ```

2. Update the following files:
   - **definition.ts**: Change `type`, `name`, `description`, and update input/output ports
   - **executor.ts**: Update the interface and implement your node's execution logic
   - **ui.tsx**: Customize the configuration UI for your node
   - **tests.ts**: Modify tests to validate your node's specific functionality 
   - **index.ts**: No changes needed unless you add/remove components

## Files Overview

### definition.ts
Defines the node's interface, appearance, and behavior in the workflow editor.

- **Required changes:**
  - Change `type` to a unique identifier for your node
  - Update `name` and `description` to reflect your node's purpose
  - Set appropriate `category` and `icon`
  - Define input/output ports specific to your node
  - Configure `defaultData` with your node's settings

### executor.ts
Contains the execution logic for your node.

- **Required changes:**
  - Update the `NodeData` interface to match your node's settings
  - Modify the `defaultData` object with appropriate defaults
  - Implement your processing logic in the `execute` function
  - Return data structured according to your output ports

### ui.tsx
Provides the configuration UI for your node.

- **Required changes:**
  - Update the validator function for your node's specific validation
  - Customize UI components for your node's settings
  - Implement handlers for user interaction

### tests.ts
Contains test cases to validate your node's functionality.

- **Required changes:**
  - Update test cases to match your node's behavior
  - Test all important aspects of your node
  - Ensure test passes indicate proper functionality

### index.ts
Exports all components of your node.

- **Usually no changes needed**
- Update only if you add or remove components

## Best Practices

1. **Type Safety**: Define proper interfaces for your node's data
2. **Error Handling**: Handle errors gracefully in both execution and UI
3. **Input Validation**: Validate inputs and configuration in both UI and execution
4. **Testing**: Create comprehensive tests covering key functionality
5. **Clean Code**: Use clear naming and comments

## Example Node Types

Consider creating these types of standard nodes:

- Data transformation nodes
- Text processing nodes
- Mathematical operation nodes
- Control flow nodes (conditionals, loops)
- Data filtering nodes
- Data aggregation nodes

## Need Help?

If you have questions about creating nodes, refer to the complete documentation in README/step-by-step-guide-creating-new-nodes.md