# Node System Architecture

This directory contains all the node definitions, executors, and UI components for the workflow system. This README provides a comprehensive overview of how the node system works, how to organize your code, and best practices for node development.

## Directory Structure

The node system follows a structured organization:

```
nodes/
├── Base/                  # Core base node components
│   ├── definition.ts      # Base node interfaces
│   ├── executor.ts        # Base execution logic
│   ├── ui.tsx             # BaseNode UI component
│   └── index.ts           # Exports
│
├── System/                # System-level nodes for core functionality
│   ├── function_node/     # JavaScript function execution node
│   ├── http_request/      # HTTP request node
│   └── ...
│
├── Custom/                # Custom application-specific nodes
│   ├── my_custom_node/    # Example custom node
│   └── ...
│
├── Integration/           # Third-party API integration nodes
│   ├── openai/            # OpenAI integration
│   └── ...
│
├── _node_templates/       # Templates for creating new nodes
│   ├── base_node_template/  # Basic node template
│   ├── data_node_template/  # Data node template
│   └── integration_node_template/ # Integration node template
│
└── components/            # Shared components used by multiple nodes
    ├── base/              # Base node UI components
    └── custom_node_ui/    # Custom UI components for node interfaces
```

## Node Component Inheritance Model

All nodes extend from the `BaseNode` component, which provides standardized behavior, styling, and functionality. The inheritance model works as follows:

1. **BaseNode** (`nodes/Base/ui.tsx`) - The core component that provides:
   - Standardized layout, styling, and hover behavior
   - Settings drawer integration
   - Node notes functionality
   - Status indicators
   - Default connection handles

2. **Custom Node UI** (`YourNode/ui.tsx`) - Your node's UI component:
   - Imports and renders BaseNode
   - Passes custom content, handles, and behavior via BaseNode props
   - Maintains unique functionality while inheriting base capabilities

This model ensures updates to BaseNode automatically apply to all nodes while preserving unique customizations.

## Creating New Nodes

### Step 1: Use a Node Template

Start by copying one of the templates from `_node_templates/`:

```bash
cp -r client/src/nodes/_node_templates/base_node_template client/src/nodes/Custom/my_new_node
```

### Step 2: Define Your Node Structure

Each node should have the following files:

```
my_new_node/
├── definition.ts   # Node type definition and interface
├── executor.ts     # Processing logic
├── ui.tsx          # Visual representation
└── index.ts        # Exports
```

### Step 3: Component Customization Best Practices

When customizing your node UI:

1. **Never Directly Modify BaseNode**:
   - Always use the BaseNode properties to customize behavior
   - Never create a modified copy of BaseNode

2. **Component Placement**:
   - Custom UI elements specific to your node should be defined in your node's `ui.tsx`
   - Reusable UI components should go in `client/src/components/nodes/custom_node_ui/`

3. **BaseNode Integration**:
   ```typescript
   export function component({ id, data, selected, isConnectable }: NodeProps) {
     // Create all custom UI elements
     const customContent = <YourCustomContent />;
     
     // Prepare data for BaseNode
     const baseNodeData = {
       ...data,
       childrenContent: customContent,
       customHandles: <YourCustomHandles />,
       // Other customizations...
     };
     
     // ALWAYS render with BaseNode
     return (
       <BaseNode
         id={id}
         data={baseNodeData}
         selected={selected}
         isConnectable={isConnectable}
         type="your_node_type"
       />
     );
   }
   ```

## BaseNode Customization Options

The `BaseNode` component offers the following customization properties:

### Content Customization
- `childrenContent`: Main custom content
- `customHeaderContent`: Content to render above the main content
- `customFooterContent`: Content to render below the main content
- `fullCustomContent`: When true, custom content takes full control

### Visual Customization
- `icon`: Custom icon (string or React component)
- `label`: Node title
- `description`: Node description
- `category`: Node category for grouping

### Status Indicators
- `isProcessing`: Node is currently running
- `isComplete`: Node has completed execution
- `hasError`: Node encountered an error
- `errorMessage`: Detailed error message

### Handle Customization
- `customHandles`: Custom connection handles
- `hideDefaultHandles`: Whether to hide default handles

### Node Notes
- `note`: Note text
- `showNote`: Whether to display the note

## Component Organization Rules

Follow these rules for component organization to ensure consistency:

1. **Categorize Properly**:
   - Use the appropriate category folder for your node (`System`, `Custom`, `Integration`)
   - Ensure your node folder name follows the naming convention (lowercase with underscores)

2. **UI Component Placement**:
   - **Node-Specific**: Components used by only one node should be in that node's folder
   - **Shared by Multiple Nodes**: Reusable components go in `client/src/components/nodes/custom_node_ui/`
   - **Base Components**: Core components used by BaseNode go in `client/src/components/nodes/base/`

3. **Composition Over Inheritance**:
   - Always compose with BaseNode rather than extending or copying it
   - Use the customization properties to alter behavior and appearance

4. **Export Patterns**:
   - Always export the required components in `index.ts`:
     ```typescript
     export { definition, execute, component };
     export default { definition, execute, component };
     ```

## Testing and Validation

Nodes should always include automated tests to ensure they function correctly:

1. Add tests in a `tests.ts` file within your node folder
2. Test both the executor function and any complex UI logic
3. Verify that your node integrates correctly with the workflow system

## Documentation

Always include clear documentation:

1. Each file should have a descriptive header comment
2. Complex functions should have detailed JSDoc comments
3. Update `ultra-simple-node-creation.md` with examples if you create a novel node type

## Performance Considerations

1. Optimize node rendering using React.memo
2. Avoid unnecessary re-renders in custom components
3. Use proper cleanup in useEffect hooks
4. Follow the component lifecycle patterns shown in the node templates

By following these guidelines, we maintain a consistent, scalable node system where updates to BaseNode benefit all nodes while preserving custom functionality.

For more detailed information on creating nodes, see the [Ultra-Simple Node Creation Guide](../../docs/ultra-simple-node-creation.md).