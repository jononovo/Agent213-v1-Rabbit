# Output Node Template

This template provides a foundation for creating nodes that send data to external systems or serve as workflow endpoints. It's designed to be copied and customized to create new output nodes for your workflows.

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
   - In `executor.ts`, modify the output logic to implement your specific functionality
   - Update the `OutputNodeData` interface to include any additional settings

5. **Update the UI**:
   - Customize the UI component in `ui.tsx` to reflect your node's appearance
   - Update the icon and visual elements

6. **Add Tests**:
   - Modify the test cases in `tests.ts` to validate your node's functionality

## Features

- **Multiple Output Types**: Supports webhooks, APIs, console, and placeholders for database and file output
- **Data Transformation**: Optional JavaScript transformation of data before sending
- **HTTP Method Selection**: Configurable HTTP methods for API and webhook outputs
- **Custom Headers**: Support for custom HTTP headers
- **Error Handling**: Graceful error handling with detailed error messages

## Example Customization

```typescript
// In definition.ts
const definition: NodeDefinition = {
  type: 'email_sender',  // Change this
  name: 'Email Sender',  // Change this
  description: 'Sends data via email',  // Change this
  category: 'communication',  // Change this if needed
  // ...other properties
};

// In executor.ts
export default async function execute(
  nodeData: OutputNodeData,
  inputData: NodeExecutionData
): Promise<NodeExecutionData> {
  // Implement your custom output logic here
  // For example, sending data via email
}
```

## Integration Guidelines

- Ensure you have proper error handling for network failures
- Consider implementing retry logic for critical outputs
- Use appropriate security measures when sending data to external systems
- Add validation for required fields before attempting to send data