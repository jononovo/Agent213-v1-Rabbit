# BaseNode Migration Guide

This guide explains how to migrate legacy nodes to use the BaseNode component structure, which provides a standardized appearance and behavior across all nodes in the workflow editor.

## Overview

The BaseNode architecture provides several benefits:
- Consistent styling and UI across all nodes
- Standardized hover menu functionality
- Unified settings drawer integration
- Consistent note system
- Better responsive behavior

## Key Components

The BaseNode architecture consists of the following key components:

1. **BaseNode** (`client/src/nodes/core/base/ui.tsx`)
   - Main wrapper component that provides standardized UI container
   - Handles shared behavior like selection, hover state, and settings
   - Manages node header, content area, and handles
   
2. **NodeHoverMenu** (`client/src/nodes/components/base/NodeHoverMenu.tsx`)
   - Provides actions menu when hovering over nodes
   - Supports standard actions: duplicate, delete, settings
   - Can be extended with custom actions

3. **Node Settings** integration
   - Standardized approach to node settings
   - Settings defined in node definition
   - UI automatically generated from settings schema

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
export const defaultData = {
  label: 'Your Node',
  description: 'Your node description',
  icon: 'icon-name',
  category: 'category',
  // Default settings
  settings: {
    setting1: 'default',
    setting2: false
  },
  // Flag to use BaseNode (if your system needs it)
  useBaseNodeWrapper: true
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

The Embed Other Workflow node was recently migrated to use the BaseNode structure. The approach was to:

1. Clone the function_node (which already used BaseNode)
2. Adapt it to provide workflow embedding functionality
3. Update the UI to display workflow-specific settings
4. Ensure consistent styling with the rest of the application

This migration improved the node's appearance and behavior while maintaining its original functionality.

## Best Practices

1. **Clone Working Nodes**: Start with a node that already uses BaseNode correctly
2. **Preserve Functionality**: Ensure the migrated node works exactly like the original
3. **Test Thoroughly**: Verify all functionality, settings, and UI elements
4. **Use Custom Content**: Take advantage of the customContent property for node-specific UI
5. **Review Settings Schema**: Update the settings schema to match your node's configuration needs

## Common Issues and Solutions

1. **Settings Not Saving**
   - Ensure settings are properly passed to BaseNode via settingsData property
   - Verify settings schema matches the expected properties

2. **Custom UI Elements Not Rendering**
   - Make sure to provide customContent to BaseNode
   - Check that you're using the right CSS classes

3. **Connection Handles Misaligned**
   - Use customHandles and hideDefaultHandles properties
   - Position handles using className with appropriate top/left values

4. **Hover Menu Not Appearing**
   - BaseNode automatically handles the hover menu
   - Ensure node has a unique ID