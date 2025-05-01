# BaseNode Migration Guide

This guide explains how to migrate legacy nodes to use the BaseNode component structure, which provides a standardized appearance and behavior across all nodes in the workflow editor.

## Overview

The BaseNode architecture provides several benefits:
- Consistent styling and UI across all nodes
- Standardized hover menu functionality with duplicate, delete, and settings actions
- Unified settings drawer integration that works across the entire application
- Consistent note system that allows users to add notes to any node
- Better responsive behavior and sizing
- More maintainable code with clearer separation of concerns

## Key Components

The BaseNode architecture consists of the following key components:

1. **BaseNode** (`client/src/nodes/core/base/ui.tsx`)
   - Main wrapper component that provides standardized UI container
   - Handles shared behavior like selection, hover state, and settings
   - Manages node header, content area, and handles
   - Provides consistent styling for all node elements
   
2. **NodeHoverMenu** (`client/src/nodes/components/base/NodeHoverMenu.tsx`)
   - Provides actions menu when hovering over nodes
   - Supports standard actions: duplicate, delete, settings
   - Appears with a slight delay for better user experience
   - Can be extended with custom actions
   - Uses event-based architecture to avoid direct dependencies

3. **Node Settings** integration
   - Standardized approach to node settings
   - Settings defined in node definition with a schema
   - UI automatically generated from settings schema
   - Global settings drawer that can be triggered from any node
   - Consistent validation and error handling
   - Custom handlers for settings initialization, saving, and dynamic field options
   - Node-based dynamic data loading for dropdown options and other field types

## Migration Process

When migrating a node to use the BaseNode structure, follow these steps:

### 1. Analyze the existing node

Review the node's current implementation to understand:
- What custom UI elements it currently has
- How it manages settings
- What input/output handles it requires

### 2. Create a new implementation based on BaseNode

The recommended approach is to:
1. Clone a working node that already uses BaseNode (e.g., function_node)
2. Rename the folder to match your node's name
3. Adapt the components to include your node's specific functionality

### 3. Implement the node's UI component

Update the `ui.tsx` file to use BaseNode:

```tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BaseNode } from '@/nodes/core/base';
import { defaultData } from './definition';

function YourNodeComponent({ id, data, selected, isConnectable }: NodeProps) {
  // Merge defaults with provided data
  const nodeData = { ...defaultData, ...data };
  
  // Get settings or use defaults
  const { 
    // Your node-specific settings
    setting1 = 'default',
    setting2 = false,
  } = nodeData.settings || {};

  // Custom content to display in the node body
  const customContent = (
    <div className="p-3">
      {/* Your custom UI elements */}
      <div className="text-sm">
        Setting 1: {setting1}
      </div>
      {setting2 && (
        <div className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md mt-2">
          Feature enabled
        </div>
      )}
    </div>
  );
  
  // Create handles for input/output connections
  const customHandles = (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
      />
    </>
  );

  // Prepare data for BaseNode
  const baseNodeData = {
    ...data,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    childrenContent: customContent,      // Custom content inside the node
    customHandles: customHandles,        // Connection handles
    hideDefaultHandles: true,            // Don't show default handles
    settingsData: nodeData.settings      // Pass settings data
  };
  
  // Return node using BaseNode
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      type="your_node_type"
    />
  );
}

export default memo(YourNodeComponent);
```

### 4. Update definition.ts and executor.ts

Make sure your node's definition and executor files are compatible with the BaseNode pattern:

```ts
// definition.ts
import { NodeDefinition } from '../../../core/types/nodeDefinitions';
import { SettingField } from '../../../core/types/nodeSettingsTypes';

// Define the node definition with handlers embedded in metadata
const definition: NodeDefinition = {
  type: 'your_node_type',
  name: 'Your Node',
  description: 'Your node description',
  category: 'category',
  version: '1.0.0',
  
  // Node settings schema
  settings: [
    {
      key: 'setting1',
      type: 'text',
      label: 'Setting 1', 
      description: 'Primary setting for the node',
      required: true
    },
    {
      key: 'setting2',
      type: 'checkbox',
      label: 'Enable Feature',
      default: false
    },
    {
      key: 'dropdown',
      type: 'select',
      label: 'Options',
      description: 'Select from available options',
      options: [] // Will be populated dynamically
    }
  ],
  
  // Include metadata with handlers for settings behavior
  metadata: {
    tags: ['example', 'node'],
    color: '#4B5563',
    
    // Node settings handlers
    handlers: {
      // Initialize settings from node data
      initializeSettings: (nodeData: Record<string, any>) => {
        const settings = { ...(nodeData.settings || {}) };
        
        // Move properties from node data to settings if needed
        if (nodeData.setting1 !== undefined) {
          settings.setting1 = nodeData.setting1;
        }
        
        return settings;
      },
      
      // Prepare settings for saving
      prepareSaveData: (settings: Record<string, any>, nodeProperties?: Record<string, any>) => {
        const saveData = { ...settings };
        
        if (nodeProperties) {
          saveData.nodeProperties = nodeProperties;
        }
        
        return saveData;
      },
      
      // Handle setting changes
      handleSettingChange: (fieldId: string, value: any, currentSettings: Record<string, any>) => {
        return { ...currentSettings, [fieldId]: value };
      },
      
      // Load dynamic field options (for dropdowns, etc.)
      loadFieldOptions: async (fields: SettingField[]): Promise<SettingField[]> => {
        try {
          // Fetch required data
          const response = await fetch('/api/your-endpoint');
          const items = await response.json();
          
          // Update field options
          const updatedFields = [...fields];
          updatedFields.forEach(field => {
            if (field.key === 'dropdown') {
              field.options = items.map(item => ({
                value: item.id.toString(),
                label: item.name
              }));
            }
          });
          
          return updatedFields;
        } catch (error) {
          console.error('Error loading field options:', error);
          return fields; // Return original fields on error
        }
      }
    }
  },
  
  // Default data
  defaultData: {
    label: 'Your Node',
    description: 'Your node description',
    // Default settings
    settings: {
      setting1: 'default',
      setting2: false
    }
  }
};

// Validator function to ensure node configuration is valid
export const validator = (data: any) => {
  const errors = [];
  
  if (!data.settings?.setting1) {
    errors.push('Setting 1 is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

### 5. Update index.ts to export all components

```ts
import YourNodeComponent from './ui';
import { execute } from './executor';
import { defaultData, validator } from './definition';

// Export components for node registration
export { execute, validator };
export const component = YourNodeComponent;

// Default export for dynamic imports
export default YourNodeComponent;
```

## Real-World Example: Embed Other Workflow Node

The Embed Other Workflow node was recently migrated to use the BaseNode structure. This case study illustrates a successful migration approach.

### Problem Statement

The original Embed Other Workflow node had these issues:
- Custom implementation that didn't use the BaseNode component
- Inconsistent styling compared to other nodes
- No hover menu integration
- Different settings drawer behavior than other nodes
- Confusing UI for selecting the target workflow

### Migration Approach

Instead of modifying the existing implementation, we used these steps:

1. **Start with a Working Template**:
   - Cloned the `function_node` folder (which already used BaseNode correctly)
   - Renamed it to `embed_other_workflow`
   - Left the original node temporarily in place while developing the replacement

2. **Adapt the UI Component**:
   - Updated the node's appearance to match its purpose
   - Created a dropdown to select target workflows
   - Added fields for configuration options (timeout, input field)
   - Ensured proper handle positions for connections

3. **Preserve the Original Logic**:
   - Kept the core workflow execution logic from the original node
   - Made only minimal changes to adapt it to the new structure
   - Ensured all existing workflows would continue to work

4. **Update the Definition**:
   - Changed node metadata (name, description, icon, category)
   - Added specific validation for the workflow ID field
   - Updated the settings schema for workflow selection

5. **Replace the Original Implementation**:
   - Once tested, copied all files to the original node directory
   - Added proper exports in the index.ts file
   - Removed the temporary development version

### Results

The migration produced several benefits:
- Consistent UI styling and behavior with other nodes
- Working hover menu with duplicate/delete functionality
- Proper settings drawer integration
- Clearer workflow selection interface
- Maintained 100% compatibility with existing workflows

### Code Changes

Key points in the implementation:

```tsx
// Preparing settings for the workflow dropdown
const settings = [
  {
    key: "workflowId",
    label: "Target Workflow",
    type: "select",
    placeholder: "Select target workflow",
    description: "The workflow that will be triggered by this node.",
    options: availableWorkflows.map(w => ({ 
      label: w.name, 
      value: w.id.toString() 
    }))
  },
  // Additional settings...
];

// Passing data to BaseNode
return (
  <BaseNode
    id={id}
    data={{
      ...data,
      icon: iconElement,
      label: nodeData.label,
      description: nodeData.description,
      settings: settings,
      settingsData: nodeData.settings || {},
      childrenContent: (
        <div className="p-3">
          <div className="text-sm">
            {selectedWorkflow ? (
              <p>Triggers workflow: <span className="font-semibold">{selectedWorkflow.name}</span></p>
            ) : (
              <p className="text-amber-500">Select a workflow in settings</p>
            )}
          </div>
        </div>
      )
    }}
    selected={selected}
    isConnectable={isConnectable}
  />
);
```

## Best Practices

1. **Clone Working Nodes**: Start with a node that already uses BaseNode correctly
2. **Preserve Functionality**: Ensure the migrated node works exactly like the original
3. **Test Thoroughly**: Verify all functionality, settings, and UI elements
4. **Use Custom Content**: Take advantage of the customContent property for node-specific UI
5. **Review Settings Schema**: Update the settings schema to match your node's configuration needs

## Common Issues and Solutions

### 1. Settings Not Saving

**Problem**: User changes settings in the drawer but values don't persist or don't affect the node.

**Solutions**:
- Make sure settings are properly passed to BaseNode via the `settingsData` property
- Verify the settings schema keys match the properties you're trying to read
- Check that you're accessing settings from the right path (e.g., `nodeData.settings` vs `nodeData.settingsData`)
- Add default values for all settings to prevent undefined errors
- Ensure your node's validator function is returning `valid: true` when appropriate

**Example fix**:
```tsx
// Before - Incorrect settings path
const { workflowId } = data.settingsData || {}; 

// After - Correct settings path
const { workflowId } = data.settings || {};

// Using a consistent approach with defaults
const settings = nodeData.settings || {};
const workflowId = settings.workflowId || null;
```

### 2. Custom UI Elements Not Rendering

**Problem**: The node appears but custom content is missing or displays incorrectly.

**Solutions**:
- Ensure you're providing `childrenContent` to BaseNode (this is the main content area)
- Check that you're using the right CSS classes from the design system
- Verify React components are correctly importing their dependencies
- Use the browser's developer tools to inspect the rendered output
- Add distinctive background colors temporarily to debug layout issues

**Example fix**:
```tsx
// Before - Missing or incorrect content prop
return (
  <BaseNode
    id={id}
    data={{
      ...data,
      label: nodeData.label,
    }}
    selected={selected}
  />
);

// After - Providing proper childrenContent
return (
  <BaseNode
    id={id}
    data={{
      ...data,
      label: nodeData.label,
      childrenContent: (
        <div className="p-3">
          <div className="text-sm">Your content here</div>
        </div>
      )
    }}
    selected={selected}
  />
);
```

### 3. Connection Handles Misaligned

**Problem**: Input/output handles are in the wrong position or overlapping.

**Solutions**:
- Use `customHandles` and `hideDefaultHandles: true` properties
- Position handles using className with appropriate top/left values
- For multiple handles on the same side, use percentage-based positioning
- Test with different node sizes to ensure proper alignment
- Remember that handles need the `isConnectable` prop from the parent

**Example fix**:
```tsx
// Multiple handles with proper positioning
const customHandles = (
  <>
    <Handle
      type="target"
      position={Position.Left}
      id="input1"
      className="top-[25%]"
      isConnectable={isConnectable}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="input2"
      className="top-[75%]"
      isConnectable={isConnectable}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="output"
      isConnectable={isConnectable}
    />
  </>
);
```

### 4. Hover Menu Not Appearing

**Problem**: The hover menu doesn't show up when hovering over the node.

**Solutions**:
- BaseNode automatically handles the hover menu integration
- Ensure the node has a unique ID (duplicate IDs can cause issues)
- Verify you're not overriding the default hover behavior
- Check if z-index issues are hiding the hover menu
- Confirm the node is properly registered in the node registry

### 5. Node Styling Inconsistencies

**Problem**: The node doesn't match the styling of other nodes.

**Solutions**:
- Let BaseNode handle the outer container styling
- Use consistent padding in childrenContent (typically `p-3`)
- Follow the design system for text sizes, colors, and spacing
- Check the theme settings for custom colors
- Use the same icon size and background styling as other nodes

### 6. Type Errors in Node Properties

**Problem**: TypeScript errors when accessing node properties.

**Solutions**:
- Ensure you're using proper type definitions for the node props
- Create interfaces for your node's specific data structure
- Provide default values for all required properties
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators
- Add appropriate type guards where needed

**Example fix**:
```tsx
// Define proper types
interface MyNodeData {
  label: string;
  settings?: {
    option1?: string;
    option2?: boolean;
  }
}

// Use proper typing in the component
function MyNode({ data, id, selected }: NodeProps<MyNodeData>) {
  // Safely access properties with defaults
  const option1 = data.settings?.option1 ?? 'default';
  const option2 = data.settings?.option2 ?? false;
  
  // ...rest of component
}
```

### 7. Integration with Node Registry

**Problem**: Node doesn't appear in the node panel or can't be added to workflows.

**Solutions**:
- Verify the node is properly exported in its index.ts file
- Check that the node type is unique across the application
- Ensure the node's folder is in the correct directory for automatic discovery
- Look for console errors related to node registration
- Update the central node registry if manual registration is required

## Advanced Customization

### Custom Node Behaviors

BaseNode can be extended with custom behaviors beyond the standard options:

1. **Custom Actions in Hover Menu**:
   - Add custom buttons to the hover menu for node-specific actions
   - Implement additional keyboard shortcuts for these actions
   - Use event-based communication for complex interactions

2. **Interactive Elements Within Nodes**:
   - Add form controls directly in the node's main content area
   - Implement inline editing capabilities for quick adjustments
   - Create collapsible sections for complex nodes

3. **Dynamic Handle Management**:
   - Add or remove handles based on node configuration
   - Create labeled handles with dynamic positioning
   - Implement handle validation based on connection types

4. **Performance Optimizations**:
   - Use React.memo to prevent unnecessary re-renders
   - Implement useMemo for expensive calculations
   - Defer loading of complex components until needed

### Implementation Tips

```tsx
// Example of a node with custom hover menu actions
const MyNodeComponent = memo(({ id, data, selected }: NodeProps) => {
  // Add custom actions to the hover menu
  const customActions = [
    {
      label: 'Preview',
      icon: <Eye size={14} />,
      onClick: () => {
        // Show a preview of the node's output
        window.dispatchEvent(new CustomEvent('show-node-preview', {
          detail: { nodeId: id }
        }));
      }
    },
    {
      label: 'Export',
      icon: <Download size={14} />,
      onClick: () => {
        // Export node data
        // ...
      }
    }
  ];
  
  // Pass custom actions to BaseNode
  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        customActions: customActions,  // Custom hover menu actions
        // Other BaseNode properties...
      }}
      selected={selected}
    />
  );
});
```

## Future Considerations

As the BaseNode system continues to evolve, consider these emerging patterns:

1. **Standardizing Node Testing**:
   - Create dedicated test utilities for BaseNode components
   - Implement snapshot testing for UI consistency
   - Add automated tests for settings validation

2. **Accessibility Improvements**:
   - Ensure all node interactions are keyboard accessible
   - Add proper ARIA attributes for screen readers
   - Implement focus management for interactive elements

3. **Performance at Scale**:
   - Optimize rendering for workflows with many nodes
   - Implement virtualization for large workflow canvases
   - Consider lazy loading strategies for complex node content

4. **Node Versioning**:
   - Support multiple versions of the same node type
   - Provide migration paths between node versions
   - Implement backwards compatibility layers

By focusing on these considerations during migration, you'll create nodes that are not only consistent with the current system but also adaptable to future improvements.