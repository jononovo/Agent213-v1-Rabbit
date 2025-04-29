# API Integration Node Template

This template provides a foundation for creating nodes that connect to external APIs.

## How to Use This Template

1. **Copy the Template**: Copy this entire folder to your target location (e.g., `client/src/nodes/Integration/my_api`)
2. **Update Node Information**: 
   - In `definition.ts`, change the node type, name, and API configuration
   - Set appropriate defaults for your specific API service
3. **Customize Logic**:
   - Update `executor.ts` to implement your API's specific request formatting and response handling
   - Modify the interface to match your node's settings and requirements
4. **Update UI**:
   - In `ui.tsx`, change the component name and customize the display
   - Make sure to update all node type references
5. **Test Your Node**:
   - Update `tests.ts` with test cases specific to your API

## Key Files

- **definition.ts**: Defines the node's properties, settings, and API configuration
- **executor.ts**: Contains the execution logic for making API requests
- **ui.tsx**: Renders the node in the workflow editor
- **tests.ts**: Contains tests to verify the node's functionality

## Important Customization Points

Look for the following comments in the code:

- `CHANGE THIS`: Indicates a value that must be changed (like the node type)
- `CUSTOMIZE THIS`: Indicates a section you might want to customize based on your needs

## API Integration Features

This template provides:

1. **Authentication** handling with API keys
2. **Error management** for API responses
3. **Timeout handling** for long-running requests
4. **Parameter handling** for different HTTP methods
5. **Header management** for API calls

## Security Considerations

- API keys are stored securely and never exposed in the UI
- The template supports environment variables for API keys
- Authentication headers are properly set for API requests

## Testing

The tests in `tests.ts` verify:
1. Basic API requests
2. Different HTTP methods (GET, POST)
3. Error handling (missing API key, timeouts)
4. Parameter handling

## Next Steps

After implementing your API node:
1. Test it with real API credentials
2. Document any specific API limitations or requirements
3. Consider adding more specialized settings for your API's features