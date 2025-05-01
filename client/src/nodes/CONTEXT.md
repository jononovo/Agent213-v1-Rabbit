# Node System Context for AI Agents

This document provides essential context for AI agents about how to work with the node system in this application. It covers key architectural principles, file organization, and best practices for adding or modifying nodes.

## Core Concepts

The node system is built on these foundational principles:

1. **BaseNode Foundation**: All node UIs extend from a common BaseNode component that provides standardized behavior, styling, and interactive features.

2. **Composition Over Inheritance**: We use composition patterns rather than inheritance to customize nodes.

3. **Separation of Concerns**:
   - `definition.ts`: Defines what the node is (type, interface, metadata)
   - `executor.ts`: Handles what the node does (processing logic)
   - `ui.tsx`: Controls how the node looks (visual representation)

4. **Node Registration**: Nodes are automatically discovered and registered by the node registry system, which is now split into multiple specialized modules:
   - `nodeRegistry.ts`: Central registry that manages node definitions
   - `nodeDiscovery.ts`: Handles scanning and discovery of nodes
   - `nodeValidation.ts`: Validates node definitions
   - `nodeDataUtils.ts`: Utilities for handling data between nodes

## Important File Locations

When working with nodes, these are the key file locations to be aware of:

- **Base Node**: `client/src/nodes/core/base/ui.tsx`
- **Node Templates**: `client/src/nodes/_node_templates/`
- **Core UI Components**: `client/src/nodes/components/base/`
- **Custom UI Components**: `client/src/nodes/components/custom_node_ui/`
- **Node Registry**: `client/src/nodes/core/registry/nodeRegistry.ts`
- **Node Documentation**: `docs/ultra-simple-node-creation.md`
- **Node Categories**: `client/src/nodes/categories/`
- **Core Node Types**: `client/src/nodes/core/types/`

## BaseNode Customization System

The BaseNode component offers a comprehensive customization system that allows nodes to have unique UIs while maintaining standardized behavior:

```typescript
// Example of BaseNode customization
const baseNodeData = {
  // Content customization
  childrenContent: <CustomContent />,       // Main content
  customHeaderContent: <HeaderContent />,   // Header area content
  customFooterContent: <FooterContent />,   // Footer area content
  fullCustomContent: false,                 // Whether to bypass standard layout
  
  // Handle customization
  customHandles: <CustomHandles />,         // Custom connection points
  hideDefaultHandles: true,                 // Hide standard handles
  
  // Visual and status
  icon: <CustomIcon />,                     // Custom icon
  isProcessing: false,                      // Running status
  isComplete: true,                         // Completion status
  hasError: false,                          // Error status
  
  // Node notes
  note: "Important information",            // Note text
  showNote: true                            // Show note on node
};
```

## Guidelines for AI Agents

When editing or creating nodes, follow these principles:

### DO:
- ✅ Use existing node templates as starting points
- ✅ Place new nodes in the appropriate category folder
- ✅ Customize nodes by passing props to BaseNode
- ✅ Create reusable UI components in the custom_node_ui folder
- ✅ Document all node interfaces and behavior
- ✅ Follow file naming conventions (snake_case for files)
- ✅ Use standardized export patterns in index.ts

### DON'T:
- ❌ Copy and modify the BaseNode component itself
- ❌ Create nodes that don't extend from BaseNode
- ❌ Override standardized behavior from BaseNode
- ❌ Duplicate functionality that already exists
- ❌ Place node-specific components in the shared folders

## Step-by-Step Instructions for Creating New Nodes

1. **Start with a template**:
   ```bash
   cp -r client/src/nodes/_node_templates/base_node_template client/src/nodes/categories/Category/new_node_name
   ```

2. **Define node interface** in `definition.ts`:
   - Set unique type name
   - Define input/output ports
   - Specify settings fields
   - Set default values

3. **Implement processing logic** in `executor.ts`:
   - Create async execute function
   - Process input data
   - Return output in the standard format
   - Include proper error handling

4. **Create the UI component** in `ui.tsx`:
   - Import BaseNode
   - Create custom UI elements
   - Pass them to BaseNode via data props
   - Export the component

5. **Export components** in `index.ts`:
   ```typescript
   export { definition, execute, component };
   export default { definition, execute, component };
   ```

## Real-World Example: Text Processing Node

Here's a complete example of how to implement a simple text processing node:

### definition.ts
```typescript
import { NodeDefinition } from '@/lib/types';

export interface TextProcessorData {
  label: string;
  description: string;
  operation: 'uppercase' | 'lowercase' | 'capitalize';
  preserveWhitespace: boolean;
}

export const defaultData: TextProcessorData = {
  label: 'Text Processor',
  description: 'Transforms text input using selected operation',
  operation: 'uppercase',
  preserveWhitespace: true
};

export const definition: NodeDefinition = {
  type: 'text_processor',
  name: 'Text Processor',
  description: 'Processes text using various transformations',
  category: 'text',
  icon: 'type',
  version: '1.0.0',
  defaultData,
  
  inputs: {
    text: {
      type: 'string',
      description: 'Text to process',
    }
  },
  
  outputs: {
    result: {
      type: 'string',
      description: 'Processed text',
    }
  },
  
  settings: {
    title: 'Text Processor Settings',
    fields: [
      {
        key: 'operation',
        label: 'Operation',
        type: 'select',
        options: [
          { label: 'Uppercase', value: 'uppercase' },
          { label: 'Lowercase', value: 'lowercase' },
          { label: 'Capitalize', value: 'capitalize' }
        ],
        description: 'Text transformation to apply'
      },
      {
        key: 'preserveWhitespace',
        label: 'Preserve Whitespace',
        type: 'checkbox',
        description: 'Keep existing whitespace in text'
      }
    ]
  }
};

export default definition;
```

### executor.ts
```typescript
import { NodeExecutionData } from '@/lib/types/workflow';

export const execute = async (
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<Record<string, NodeExecutionData>> => {
  try {
    const startTime = new Date();
    
    // Get settings
    const { operation = 'uppercase', preserveWhitespace = true } = nodeData;
    
    // Get input text
    const inputText = inputs?.text?.items?.[0]?.json || '';
    
    // Process based on operation
    let result = '';
    
    // Remove extra whitespace if not preserving
    const textToProcess = preserveWhitespace 
      ? inputText 
      : inputText.replace(/\s+/g, ' ').trim();
    
    switch (operation) {
      case 'uppercase':
        result = textToProcess.toUpperCase();
        break;
      case 'lowercase':
        result = textToProcess.toLowerCase();
        break;
      case 'capitalize':
        result = textToProcess
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    const endTime = new Date();
    
    // Return result
    return {
      result: {
        items: [{ json: result }],
        meta: {
          startTime,
          endTime,
          source: `text_processor:${operation}`
        }
      }
    };
  } catch (error) {
    console.error('Error in text_processor:', error);
    
    return {
      result: {
        items: [{ json: null }],
        meta: {
          error: true,
          errorMessage: error.message
        }
      }
    };
  }
};

export default execute;
```

### ui.tsx
```typescript
import React from 'react';
import { NodeProps } from 'reactflow';
import { Type, ArrowRight } from 'lucide-react';
import { BaseNode } from '@/nodes/core/base';
import { HandleWithLabel } from '@/nodes/components/custom_node_ui/handle_with_label';
import { Position } from 'reactflow';
import { defaultData, TextProcessorData } from './definition';

export function component({ id, data, selected, isConnectable }: NodeProps<TextProcessorData>) {
  // Merge with defaults
  const nodeData = { ...defaultData, ...data };
  
  // Get settings
  const { 
    operation = 'uppercase',
    preserveWhitespace = true
  } = nodeData.settingsData || {};
  
  // Create custom content
  const customContent = (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Operation:</span>
        <span className="bg-primary/10 px-2 py-1 rounded text-primary">
          {operation === 'uppercase' ? 'UPPERCASE' : 
           operation === 'lowercase' ? 'lowercase' : 
           'Capitalize'}
        </span>
      </div>
      
      {!preserveWhitespace && (
        <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
          <span>Whitespace will be normalized</span>
        </div>
      )}
    </div>
  );
  
  // Create custom handles
  const customHandles = (
    <>
      <HandleWithLabel
        type="target"
        position={Position.Left}
        id="text"
        label="Text"
        isConnectable={isConnectable}
      />
      
      <HandleWithLabel
        type="source"
        position={Position.Right}
        id="result"
        label="Result"
        isConnectable={isConnectable}
      />
    </>
  );
  
  // Create custom icon
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Type className="h-4 w-4 text-primary" />
    </div>
  );
  
  // Prepare data for BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    settingsData: nodeData,
    childrenContent: customContent,
    customHandles: customHandles,
    hideDefaultHandles: true
  };
  
  // Render with BaseNode
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="text_processor"
    />
  );
}

export default component;
```

### index.ts
```typescript
import { definition } from './definition';
import { execute } from './executor';
import { component } from './ui';

export { definition, execute, component };
export default { definition, execute, component };
```

Follow this pattern when creating new nodes to ensure consistency and maintain the benefits of the BaseNode system while creating rich, unique node UIs.

For more detailed information, refer to the node system [README.md](./README.md) and the [Ultra-Simple Node Creation Guide](../../docs/ultra-simple-node-creation.md).