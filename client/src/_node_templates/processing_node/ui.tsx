/**
 * Processing Node Template - UI Component
 * 
 * This component renders the processing node in the workflow editor.
 * It uses the BaseNode component to ensure consistency with the system.
 */

import React from 'react';
import { Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BaseNode from '@/nodes/Base';
import { NodeProps } from 'reactflow';
import { BaseNodeData } from '@/nodes/Base/ui';

export default function ProcessingNodeComponent({ id, data, selected, isConnectable }: NodeProps) {
  // Extract essential settings with defaults
  const settingsData = data?.settingsData || {};
  const processingLogic = settingsData.processingLogic || 'function process(data, options) { return data; }';
  
  // Format code preview (show first 2 lines only)
  const formatCodePreview = (code: string) => {
    const lines = code.split('\n');
    if (lines.length <= 2) return code;
    return lines.slice(0, 2).join('\n') + '\n...';
  };
  
  // Prepare custom content for the node
  const customContent = (
    <div className="flex flex-col gap-2">
      {/* Code preview */}
      <div className="text-xs font-mono bg-muted/50 p-2 rounded overflow-hidden">
        {formatCodePreview(processingLogic)}
      </div>
    </div>
  );
  
  // Prepare the node data with the properties expected by BaseNode
  const baseNodeData: BaseNodeData = {
    ...data,
    icon: Code,
    label: data.label || 'Process',
    description: data.description || 'Processes data using JavaScript',
    settingsData,
    // Add the custom content to the node data instead of using children prop
    childrenContent: customContent,
    // Maintain the existing custom handles flag if present,
    // otherwise don't hide the default handles
    hideDefaultHandles: data.hideDefaultHandles
  };
  
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="processing_node"
    />
  );
}