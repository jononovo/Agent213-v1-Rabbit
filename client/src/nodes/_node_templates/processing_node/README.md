# Processing Node Template

This template provides a foundation for creating nodes that process data using JavaScript functions. It's designed to be copied and customized to create new processing nodes for your workflows.

## Files

- **definition.ts** - Defines the node's structure, settings, and metadata
- **executor.ts** - Contains the logic for executing the node's functionality
- **ui.tsx** - Renders the node in the workflow editor
- **tests.ts** - Test cases for validating the node's functionality
- **index.ts** - Main export file for the node's components

## How to Use This Template

1. **Copy the Template**:
   Copy this entire folder to your target location (typically under `client/src/nodes/Custom/` or another appropriate directory).

2. **Rename the Node Type**:
   In `definition.ts`, change the `type` property to match your new node's name.

3. **Customize the Node**:
   - Update the node's name, description, and category in `definition.ts`
   - Modify the inputs and outputs as needed
   - Customize the settings to reflect your node's configuration options

4. **Implement Your Logic**:
   - In `executor.ts`, modify the processing logic to implement your specific functionality
   - Update the `ProcessingNodeData` interface to include any additional settings

5. **Update the UI**:
   - Customize the UI component in `ui.tsx` to reflect your node's appearance
   - Update the icon and visual elements

6. **Add Tests**:
   - Modify the test cases in `tests.ts` to validate your node's functionality

## Features

- **JavaScript Evaluation**: Safely evaluates JavaScript functions with timeout protection
- **Template Support**: Comes with several pre-defined code templates for common processing tasks
- **Async Support**: Can handle both synchronous and asynchronous functions
- **Error Handling**: Gracefully handles errors during execution
- **Timeout Protection**: Prevents infinite loops or long-running code execution

## Example Customization

```typescript
// In definition.ts
const definition: NodeDefinition = {
  type: 'my_custom_processor',  // Change this
  name: 'My Custom Processor',  // Change this
  description: 'Processes data in a specific way',  // Change this
  category: 'custom',  // Change this if needed
  // ...other properties
};

// In executor.ts
export default async function execute(
  nodeData: ProcessingNodeData,
  inputData: NodeExecutionData
): Promise<NodeExecutionData> {
  // Implement your custom processing logic here
}
```

## Integration Guidelines

- Make sure your node properly passes data between connected nodes
- Consider adding validation for input data
- Use descriptive error messages to help users debug issues
- Add appropriate documentation in your code