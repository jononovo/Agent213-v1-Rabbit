# Node UI Components

This directory contains UI components specifically designed for node rendering in the workflow system. These components are organized to ensure consistent design, reusability, and proper extension of the BaseNode component.

## Directory Structure

```
components/nodes/
├── base/                 # Core node UI building blocks
│   ├── NodeContainer.tsx # Outer wrapper with consistent styling
│   ├── NodeContent.tsx   # Content area with padding control
│   ├── NodeHeader.tsx    # Header with title, icon, and actions
│   ├── NodeHoverMenu.tsx # Hover action menu for nodes
│   └── index.ts          # Exports
│
├── custom_node_ui/       # Reusable custom UI elements for nodes
│   ├── handle_with_label.tsx    # Handle with text label
│   ├── handle_editable.tsx      # Handle with edit/delete capability
│   ├── input_select.tsx         # Dropdown input for nodes
│   ├── input_text.tsx           # Text input for nodes
│   ├── input_toggle.tsx         # Toggle switch for nodes
│   ├── custom_node_preview.tsx  # Node preview renderer
│   └── ...
│
└── README.md             # This documentation
```

## Component Categories and Usage Guidelines

### Base Components

The `base/` directory contains the fundamental building blocks used by BaseNode. These components should:

- Remain simple, focused, and highly reusable
- Maintain consistent styling and behavior
- Provide clear props interfaces
- Use composition patterns to enable extensibility

**When to modify:**
- Only modify these when making system-wide changes to node appearance or behavior
- Any changes here will affect ALL nodes

### Custom Node UI Components

The `custom_node_ui/` directory contains reusable UI elements specifically designed for use within custom node implementations. These components:

- Provide specialized UI controls for common node functionality
- Follow consistent styling and interaction patterns
- Are designed to work seamlessly with BaseNode

**When to add a component here:**
1. When the component will be used by multiple different node types
2. When the component represents a standardized UI pattern
3. When the component provides a generic capability like handle rendering

**Examples:**
- `handle_with_label.tsx`: Renders connection handles with text labels
- `input_select.tsx`: Dropdown control for node settings
- `code_editor.tsx`: Specialized code input for script-based nodes

## Development Guidelines

### Creating New Components

When creating a new component for this directory:

1. **Determine the Correct Location**
   - If it's used by only one node type, keep it in that node's folder
   - If it's used by multiple nodes, place it in `custom_node_ui/`
   - If it's a foundational element of all nodes, place it in `base/`

2. **Follow Naming Conventions**
   - Use `snake_case` for filenames
   - Use `PascalCase` for component names
   - Use descriptive, functional names (e.g., `handle_with_label.tsx`)

3. **Component Structure**
   ```typescript
   import React from 'react';
   
   interface YourComponentProps {
     // Well-defined props with clear types
     label: string;
     value: string;
     onChange: (value: string) => void;
     // Include optional props with defaults
     disabled?: boolean;
   }
   
   /**
    * YourComponent - Description of what it does
    * 
    * Usage example:
    * <YourComponent label="Setting" value="initial" onChange={handleChange} />
    */
   export function YourComponent({ 
     label, 
     value, 
     onChange,
     disabled = false
   }: YourComponentProps) {
     // Implementation
     return (
       <div className="bem-based-classnames">
         {/* Component content */}
       </div>
     );
   }
   ```

4. **Styling Approach**
   - Use Tailwind CSS classes for styling
   - Follow the existing design system
   - Use consistent color variables and spacing
   - Include responsive design considerations

5. **Export Pattern**
   - Always export components as named exports
   - Include in the folder's index.ts for easy imports

### Extending BaseNode vs Creating Custom UI

**Always** use BaseNode's customization properties rather than creating a new version of BaseNode:

```typescript
// CORRECT: Pass custom content to BaseNode
function YourNodeUI({ id, data, selected }: NodeProps) {
  const customContent = (
    <div className="your-custom-ui">
      {/* Your UI elements */}
    </div>
  );
  
  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        childrenContent: customContent,
        // other customizations
      }}
      selected={selected}
    />
  );
}

// WRONG: Don't recreate BaseNode functionality
function YourNodeUI({ id, data, selected }: NodeProps) {
  return (
    <div className="your-custom-node">
      <div className="your-header">{data.label}</div>
      <div className="your-content">
        {/* Custom implementation that doesn't use BaseNode */}
      </div>
    </div>
  );
}
```

## Updating the BaseNode Component

When enhancing BaseNode capabilities:

1. First update `client/src/nodes/Base/ui.tsx` with new features
2. Then update any affected components in `components/nodes/base/`
3. Add the new capabilities to the interface in BaseNode
4. Update documentation in both READMEs
5. Test with existing nodes to ensure backward compatibility

## Component Testing Guidelines

UI components should include proper testing:

1. Test both visual rendering and functional interactions
2. Verify accessibility compliance
3. Test with all possible prop combinations
4. Ensure responsive behavior across device sizes

## Common Pitfalls to Avoid

1. **Duplicated Logic**: Don't recreate functionality already in BaseNode
2. **Inconsistent Styling**: Always use the established design system
3. **Coupling to Specific Nodes**: Keep components reusable and decoupled
4. **Poor Performance**: Optimize for render performance with React.memo and useMemo
5. **Missing Documentation**: Always include clear comments and examples

By following these guidelines, we maintain a consistent UI library that enables creating rich, unique nodes while preserving standardized behavior across the application.