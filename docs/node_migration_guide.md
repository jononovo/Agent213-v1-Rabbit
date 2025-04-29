# Node Migration and Adaptation Guide

This guide provides a systematic approach for importing or adapting nodes from other systems (including legacy nodes from our previous architecture) into the current node system.

## Table of Contents

1. [Understanding the Migration Process](#understanding-the-migration-process)
2. [Migrating Legacy Internal Nodes](#migrating-legacy-internal-nodes)
3. [Adapting Third-Party Nodes](#adapting-third-party-nodes)
4. [Compatibility Checklist](#compatibility-checklist)
5. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
6. [Testing and Validation](#testing-and-validation)

## Understanding the Migration Process

When importing nodes from other systems, we need to preserve the functionality and user experience while ensuring compatibility with our architecture. The process involves:

1. **Functionality Analysis**: Identify the core functionality and features
2. **Structure Adaptation**: Restructure to fit our node architecture
3. **Interface Alignment**: Ensure UI components match our standards
4. **Integration**: Connect to our execution engine

Remember the key principle: **Import the functionality and user experience, not the implementation structure.**

## Migrating Legacy Internal Nodes

### Step 1: Analyze the Legacy Node

Before migrating, document the key aspects of the legacy node:

- Core functionality and features
- Input/output schema and data types
- Settings and configuration options
- UI components and interactions
- Special handlers or custom logic

### Step 2: Create the New Node Structure

1. **Set up the standard folder structure**:
   ```
   new_node_name/
   ├── definition.ts
   ├── executor.ts
   ├── ui.tsx
   └── index.ts
   ```

2. **Define the node interface** in `definition.ts`:
   ```typescript
   // Import necessary types
   import { NodeDefinition } from '@/lib/types/node';

   // Define your node's data structure (similar to legacy)
   export interface YourNodeData {
     // Core properties from base node
     label: string;
     description: string;
     
     // Keep functionality-critical properties from legacy node
     legacyFeatureX?: boolean;
     legacySettingY?: string;
     // Add any new properties needed
   }
   
   // Set default values
   export const defaultData: YourNodeData = {
     label: 'Your Node Name',
     description: 'Migrated from legacy system',
     legacyFeatureX: true,
     legacySettingY: 'default',
   };
   
   // Define the node
   export const definition: NodeDefinition = {
     type: 'your_node_name',  
     name: 'Your Node Name',
     description: 'Detailed description',
     category: 'appropriate_category',
     icon: 'appropriate_icon',
     version: '1.0.0',
     
     // Use the default data
     defaultData,
     
     // Define inputs/outputs based on legacy functionality
     inputs: {
       // Map legacy inputs to new structure
       input_name: {
         type: 'appropriate_type',
         description: 'Description from legacy',
       }
     },
     outputs: {
       // Map legacy outputs to new structure
       output_name: {
         type: 'appropriate_type',
         description: 'Description from legacy',
       }
     },
     
     // Settings based on legacy configuration
     settings: {
       title: 'Node Settings',
       fields: [
         // Map legacy settings to new format
         {
           key: 'legacyFeatureX',
           label: 'Legacy Feature X',
           type: 'checkbox',
           description: 'Original description'
         },
         {
           key: 'legacySettingY',
           label: 'Legacy Setting Y',
           type: 'text',
           description: 'Original description'
         }
       ]
     }
   };
   
   export default definition;
   ```

### Step 3: Port the Processing Logic

In the `executor.ts` file, adapt the legacy processing logic:

```typescript
import { NodeExecutionData } from '@/lib/types/workflow';

export const execute = async (
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, NodeExecutionData>> => {
  try {
    const startTime = new Date();
    
    // Extract settings similar to legacy node
    const { legacyFeatureX, legacySettingY } = nodeData;
    
    // Get input similar to legacy node
    const inputData = inputs?.input_name?.items?.[0]?.json;
    
    // PORT CORE LOGIC FROM LEGACY NODE HERE
    // ---------------------------------------
    // This is where you maintain the functional logic
    // from the legacy node while adapting it to the new
    // execution structure
    
    let result;
    
    // Example of preserving legacy logic:
    if (legacyFeatureX) {
      result = handleLegacyFeatureX(inputData, legacySettingY);
    } else {
      result = regularProcessing(inputData);
    }
    
    // Any additional processing from legacy node
    
    const endTime = new Date();
    
    // Return using new result format
    return {
      output_name: {
        items: [{ json: result }],
        meta: { startTime, endTime }
      }
    };
  } catch (error) {
    console.error(`Error in migrated node:`, error);
    return {
      output_name: {
        items: [{ json: null }],
        meta: { error: true, errorMessage: error.message }
      }
    };
  }
};

// Helper functions from legacy node
function handleLegacyFeatureX(data, setting) {
  // Port the legacy implementation here
}

function regularProcessing(data) {
  // Port the legacy implementation here
}

export default execute;
```

### Step 4: Adapt the UI Components

In the `ui.tsx` file, convert the legacy UI to our BaseNode pattern:

```typescript
import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '@/nodes/Base';
import { Position } from 'reactflow';
import { HandleWithLabel } from '@/components/nodes/custom_node_ui/handle_with_label';
import { defaultData, YourNodeData } from './definition';

// You may want to import components similar to what the legacy node used
import { SomeCustomControl } from '@/components/nodes/custom_node_ui/some_custom_control';

function YourNodeComponent({ id, data, selected, isConnectable }: NodeProps<YourNodeData>) {
  // Combine with defaults for safety
  const nodeData = { ...defaultData, ...data };
  
  // Extract settings similar to legacy node
  const { legacyFeatureX, legacySettingY } = nodeData.settingsData || {};
  
  // Create the custom content based on legacy UI
  const customContent = (
    <div className="flex flex-col gap-2 p-3">
      {/* Adapt the legacy UI elements to modern components */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Legacy Setting:</span>
        <span className="bg-primary/10 px-2 py-1 rounded text-primary">
          {legacySettingY}
        </span>
      </div>
      
      {legacyFeatureX && (
        <div className="p-2 bg-blue-500/10 text-blue-600 rounded text-xs">
          Legacy Feature X is enabled
        </div>
      )}
      
      {/* PORT OTHER UI ELEMENTS FROM LEGACY NODE */}
      {/* Use modern components that provide similar functionality */}
    </div>
  );
  
  // Create custom handles based on legacy inputs/outputs
  const customHandles = (
    <>
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="input_name"
        label="Input"
        isConnectable={isConnectable}
      />
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="output_name"
        label="Output"
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Prepare the node data
  const baseNodeData = {
    ...data,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    
    // Maintain legacy aesthetics if possible
    icon: 'icon_similar_to_legacy',
    
    // Pass the custom elements
    childrenContent: customContent,
    customHandles: customHandles,
    hideDefaultHandles: true,
    
    // Pass all node data for settings
    settingsData: nodeData
  };
  
  // Render using BaseNode component
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="your_node_name"
    />
  );
}

// Export with memo for optimization
export default memo(YourNodeComponent);
```

### Step 5: Set Up Exports

In the `index.ts` file:

```typescript
import { definition } from './definition';
import { execute } from './executor';
import YourNodeComponent from './ui';

// Export for module usage
export { definition, execute };
export const component = YourNodeComponent;

// Default export for dynamic loading
export default { definition, execute, component: YourNodeComponent };
```

## Adapting Third-Party Nodes

When adapting nodes from third-party systems, follow these additional steps:

### Step 1: Research and Compliance

1. **Check licensing** to ensure you can legally adapt the node
2. **Document attribution** requirements
3. **Note any API dependencies** that need to be maintained

### Step 2: Extract Core Functionality

1. Identify the **essential features** (not implementation details)
2. Document the **data transformation flow**
3. Note any **special algorithms or techniques**
4. Identify **user interface patterns** worth preserving

### Step 3: Implement Using Our Architecture

Follow the same node creation process as for legacy nodes, but:

1. **Do not copy code directly** - reimplement the functionality
2. **Use our design patterns** even if they differ from the original
3. **Adapt terminology** to match our system
4. **Normalize data structures** to fit our execution engine

### Step 4: Integration with External APIs

If the third-party node connected to external services:

1. Use our **integration node patterns** (see Integration section in main documentation)
2. Implement **proper error handling** specific to that API
3. Add **appropriate rate limiting** based on the service's requirements
4. Consider **credential management** needs

## Compatibility Checklist

Before considering the migration complete, verify:

- [ ] **Default Export Pattern**: Using `export default memo(ComponentName)` for UI components
- [ ] **Node Registration**: Node properly appears in the node registry
- [ ] **Input/Output Compatibility**: Ports connect properly with other nodes
- [ ] **Settings Drawer**: All settings load and save correctly  
- [ ] **Execution Flow**: Node executes correctly in workflow context
- [ ] **Error Handling**: Errors are caught and presented correctly
- [ ] **UI Consistency**: Adheres to our design language
- [ ] **Documentation**: Usage and customization documented

## Common Pitfalls and Solutions

| Pitfall | Solution |
|---------|----------|
| Legacy node used global state | Convert to local state and props |
| Third-party node uses incompatible data format | Add adapter functions in executor |
| Complex UI components from other systems | Break down and rebuild with our UI components |
| Legacy settings don't map to our drawer | Create custom settings implementation |
| Direct DOM manipulation in legacy code | Convert to React-compatible approaches |
| Hardcoded styling | Use our utility classes and design system |
| Legacy error handling | Convert to our standardized error pattern |

## Testing and Validation

Test your migrated node thoroughly:

1. **Unit Tests**: Verify core logic works in isolation
2. **Integration Tests**: Ensure it works with other nodes
3. **UI Tests**: Confirm the interface functions correctly
4. **Edge Cases**: Test with unusual inputs
5. **Comparison Testing**: Compare outputs with the original node

Remember that the goal is to maintain functionality and user experience, not to preserve implementation details. When in doubt, prioritize compatibility with our system over perfect fidelity to the original node.