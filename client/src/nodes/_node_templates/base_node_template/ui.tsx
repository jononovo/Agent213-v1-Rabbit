/**
 * Base Node Template UI Component
 * 
 * This is a minimal implementation of a node UI component using BaseNode.
 * Replace this comment with a description of your node's UI.
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '@/nodes/core/base';
import { Package } from 'lucide-react'; // Default icon, change as needed
import { BaseNodeTemplateData, defaultData } from './definition';

// Re-export the default data for use elsewhere
export { defaultData };

// Node UI component
export function component({ id, data, selected, isConnectable }: NodeProps<BaseNodeTemplateData>) {
  // Merge incoming data with default data
  const nodeData = { ...defaultData, ...data };

  // Create a custom content element for your node
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      {/* Add your custom UI elements here */}
      <div className="text-sm">
        {/* This is placeholder content - replace with your own UI */}
        <p className="text-muted-foreground text-xs">
          Status: Ready
        </p>
      </div>
    </div>
  );

  // Create icon element for the header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <Package className="h-4 w-4 text-primary" />
    </div>
  );

  // Prepare the node data with the properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    settingsData: nodeData,
    childrenContent: customContent,
    // Set to false if you want to show default handles
    hideDefaultHandles: false
  };
  
  // Render the node using BaseNode component
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="base_node_template"
    />
  );
}