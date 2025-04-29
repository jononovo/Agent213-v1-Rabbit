# Webhook Integration Node Template

This template provides a foundation for creating webhook integration nodes that can receive data from external systems.

## How to Use This Template

1. **Copy the Template**: Copy this entire folder to your target location (e.g., `client/src/nodes/Integration/my_webhook`)
2. **Update Node Information**: 
   - In `definition.ts`, change the node type, name, and description
   - Set appropriate defaults and customize settings as needed
3. **Customize Logic**:
   - Modify `executor.ts` to implement your webhook's specific logic
   - Update the interface to match your node's settings
4. **Update UI**:
   - In `ui.tsx`, change the component name and customize the UI
   - Make sure to update the node type references
5. **Test Your Node**:
   - Update `tests.ts` with appropriate test cases
   - Make sure to change the node type references

## Key Files

- **definition.ts**: Defines the node's properties, inputs, outputs, and settings
- **executor.ts**: Contains the execution logic and integration registration
- **ui.tsx**: Renders the node in the workflow editor
- **tests.ts**: Contains tests to verify the node's functionality

## Important Customization Points

Look for the following comments in the code:

- `CHANGE THIS`: Indicates a value that must be changed (like the node type)
- `CUSTOMIZE THIS`: Indicates a section you might want to customize based on your needs

## Webhook URL Structure

By default, this template uses the following URL structure:
- With custom path: `webhooks/your-custom-path`
- Without custom path: `webhooks/workflow/{workflowId}/node/{nodeId}`

## Testing

The tests in `tests.ts` verify:
1. Basic webhook functionality
2. Handling of input payloads

To run tests, use the node testing framework in the application.

## Integration Engine

This template is designed to work with the Integration Engine, which:
- Automatically registers webhook endpoints
- Makes them immediately available for external systems
- Handles incoming requests and routes them to the appropriate workflow

## Next Steps

After implementing your webhook node:
1. Test it thoroughly
2. Document any special features or requirements
3. Consider security implications of your webhook design