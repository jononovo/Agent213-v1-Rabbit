# Base Node Template

This is a minimal template for creating custom nodes using the BaseNode component. It provides the essential structure with placeholder implementations that you can customize for your specific needs.

## Files in this Template

- **definition.ts**: Defines the node interface, types, and properties
- **executor.ts**: Contains the execution logic for the node
- **ui.tsx**: Implements the visual representation using BaseNode
- **tests.ts**: Provides basic test cases for the node
- **index.ts**: Exports all components for node registration

## How to Use This Template

1. **Copy this template**: Create a new folder for your node and copy all files from this template
2. **Rename components**: Update all references to `base_node_template` and `BaseNodeTemplate` to your node's name
3. **Customize the definition**: Update the node type, name, description, and I/O ports
4. **Implement execution logic**: Modify the executor function to perform your node's specific functionality
5. **Design the UI**: Customize the UI component to display relevant information and controls
6. **Update tests**: Add or modify test cases to validate your node's behavior

## Required Customizations

### In definition.ts:
- Update the interface name and properties
- Change the `type` to a unique identifier for your node
- Set appropriate `name`, `description`, and `category`
- Define your node's input and output ports

### In executor.ts:
- Implement your node's execution logic
- Handle all relevant error cases

### In ui.tsx:
- Customize the icon (import from lucide-react)
- Design the content section with relevant UI elements
- Set appropriate property values for BaseNode

## Example Usage

```tsx
// When your node is ready, it can be used in workflows like this:
<YourCustomNode 
  id="unique-id"
  data={{ 
    label: "Your Node", 
    // Other properties specific to your node
  }}
  selected={false}
  isConnectable={true}
/>
```

## Best Practices

- Keep your node's functionality focused and specific
- Provide clear input/output port descriptions
- Include comprehensive error handling
- Use TypeScript interfaces to ensure type safety
- Write thorough tests for all functionality
- Document any special configuration requirements